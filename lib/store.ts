// File-backed persistence. Survives restart. Swap to Supabase later.
import fs from "fs";
import path from "path";
import crypto from "crypto";

type Signal = {
  id: string;
  wallet: string;
  tokenId: number;
  postedAt: number;
  multiplier: number;
  tweetId?: string;
  tier?: string;
  status?: "pending" | "verified" | "expired";
  hash?: string;
  pendingExpiresAt?: number;
};

type Holder = {
  wallet: string;
  tokenIds: number[];
  totalScore: number;
  streak: number;
  lastSignalAt: number;
};

type Override = { startedAt: number; durationMs: number };

const DB_PATH = path.join(process.cwd(), ".data", "store.json");

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

class Store {
  signals: Signal[] = [];
  holders = new Map<string, Holder>();
  override: Override | null = null;
  rateBucket = new Map<string, number[]>();

  constructor() { this.load(); }

  load() {
    try {
      ensureDir();
      if (fs.existsSync(DB_PATH)) {
        const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
        this.signals = raw.signals || [];
        this.holders = new Map(Object.entries(raw.holders || {}));
        this.override = raw.override || null;
      }
    } catch (e) { console.error("store.load error:", e); }
  }

  save() {
    try {
      ensureDir();
      fs.writeFileSync(DB_PATH, JSON.stringify({
        signals: this.signals,
        holders: Object.fromEntries(this.holders),
        override: this.override,
      }));
    } catch (e) { console.error("store.save error:", e); }
  }

  seedHolders() {
    if (this.holders.size > 0) return;
    const handles = [
      "vitalik.eth", "punk6529.eth", "lucanetz.eth", "weitsman.eth",
      "garga.eth", "xcopy.eth", "beeple.eth", "loki.eth",
      "zeneca.eth", "farokh.eth", "osfrekt.eth", "waleswoosh.eth",
      "burnttoast.eth", "loopify.eth", "vvd.eth", "pranksy.eth",
    ];
    handles.forEach((h, i) => {
      this.holders.set(h, {
        wallet: h,
        tokenIds: [i + 21, i + 100, i + 1000],
        totalScore: Math.floor(Math.random() * 100),
        streak: Math.floor(Math.random() * 10),
        lastSignalAt: Date.now() - Math.random() * 86400000,
      });
    });
    this.save();
  }

  isOverrideActive() {
    if (!this.override) return { active: false, secondsLeft: 0 };
    const elapsed = Date.now() - this.override.startedAt;
    if (elapsed > this.override.durationMs) {
      this.override = null;
      this.save();
      return { active: false, secondsLeft: 0 };
    }
    return { active: true, secondsLeft: Math.floor((this.override.durationMs - elapsed) / 1000) };
  }

  startOverride(minutes = 60) {
    this.override = { startedAt: Date.now(), durationMs: minutes * 60_000 };
    this.save();
  }

  rateLimit(wallet: string) {
    const now = Date.now();
    const window = 60_000;
    const max = 5;
    const arr = (this.rateBucket.get(wallet) || []).filter(t => now - t < window);
    if (arr.length >= max) {
      return { ok: false, retryIn: Math.ceil((arr[0] + window - now) / 1000) };
    }
    arr.push(now);
    this.rateBucket.set(wallet, arr);
    return { ok: true, retryIn: 0 };
  }

  // Create a PENDING signal — returns hash to post on X
  createPendingSignal(wallet: string, tokenId: number, tier = "Common"): Signal {
    const hash = "F" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const sig: Signal = {
      id: Math.random().toString(36).slice(2, 10),
      wallet,
      tokenId,
      postedAt: Date.now(),
      multiplier: 1,
      tier,
      status: "pending",
      hash,
      pendingExpiresAt: Date.now() + 15 * 60 * 1000, // 15 min to post
    };
    this.signals.unshift(sig);
    if (this.signals.length > 1000) this.signals.length = 1000;
    this.save();
    return sig;
  }

  // Mark a signal verified - upgrade scoring
  verifySignal(id: string, tweetId: string): Signal | null {
    const sig = this.signals.find(s => s.id === id);
    if (!sig) return null;
    if (sig.status === "verified") return sig;
    if (sig.pendingExpiresAt && Date.now() > sig.pendingExpiresAt) {
      sig.status = "expired";
      this.save();
      return sig;
    }
    sig.status = "verified";
    sig.tweetId = tweetId;
    sig.multiplier = this.isOverrideActive().active ? 5 : 1;

    // Update holder score now
    let h = this.holders.get(sig.wallet);
    if (!h) {
      h = { wallet: sig.wallet, tokenIds: [sig.tokenId], totalScore: 0, streak: 0, lastSignalAt: 0 };
      this.holders.set(sig.wallet, h);
    }
    if (!h.tokenIds.includes(sig.tokenId)) h.tokenIds.push(sig.tokenId);
    const within24h = Date.now() - h.lastSignalAt < 24 * 3600 * 1000;
    h.streak = within24h ? h.streak + 1 : 1;
    h.totalScore += sig.multiplier;
    h.lastSignalAt = Date.now();

    this.save();
    return sig;
  }

  // Sweep expired pending
  sweepExpired() {
    const now = Date.now();
    let changed = false;
    for (const s of this.signals) {
      if (s.status === "pending" && s.pendingExpiresAt && now > s.pendingExpiresAt) {
        s.status = "expired";
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Legacy: instant signal (used by demo loop)
  recordSignal(wallet: string, tokenId: number, tweetId?: string, tier = "Common"): Signal {
    const mult = this.isOverrideActive().active ? 5 : 1;
    const sig: Signal = {
      id: Math.random().toString(36).slice(2, 10),
      wallet, tokenId, postedAt: Date.now(),
      multiplier: mult, tweetId, tier,
      status: "verified",
    };
    this.signals.unshift(sig);
    if (this.signals.length > 1000) this.signals.length = 1000;

    let h = this.holders.get(wallet);
    if (!h) {
      h = { wallet, tokenIds: [tokenId], totalScore: 0, streak: 0, lastSignalAt: 0 };
      this.holders.set(wallet, h);
    }
    if (!h.tokenIds.includes(tokenId)) h.tokenIds.push(tokenId);
    const within24h = Date.now() - h.lastSignalAt < 24 * 3600 * 1000;
    h.streak = within24h ? h.streak + 1 : 1;
    h.totalScore += mult;
    h.lastSignalAt = Date.now();

    this.save();
    return sig;
  }

  recentSignals(n = 50) {
    return this.signals.filter(s => s.status !== "pending" && s.status !== "expired").slice(0, n);
  }

  pendingForWallet(wallet: string) {
    return this.signals.filter(s => s.wallet === wallet && s.status === "pending");
  }

  leaderboard(n = 100) {
    return Array.from(this.holders.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, n);
  }

  holderStats(wallet: string) {
    return this.holders.get(wallet);
  }

  replyTargets(excludeWallet: string, n = 2) {
    const recent = this.signals
      .filter(s => s.wallet !== excludeWallet && s.status !== "pending")
      .slice(0, 30);
    const seen = new Set<string>();
    const out: Signal[] = [];
    for (const s of recent) {
      if (seen.has(s.wallet)) continue;
      seen.add(s.wallet);
      out.push(s);
      if (out.length >= n) break;
    }
    return out;
  }

  closestUp(wallet: string) {
    const lb = this.leaderboard(99999);
    const idx = lb.findIndex(h => h.wallet === wallet);
    if (idx <= 0) return null;
    const target = lb[idx - 1];
    const me = lb[idx];
    return { wallet: target.wallet, gap: target.totalScore - me.totalScore };
  }
}

const g = globalThis as any;
if (!g.__freelons_store) {
  const s = new Store();
  s.seedHolders();
  if (process.env.FREELONS_DEMO !== "off") {
    setInterval(() => {
      const wallets = Array.from(s.holders.keys());
      if (wallets.length === 0) return;
      const w = wallets[Math.floor(Math.random() * wallets.length)];
      const h = s.holders.get(w)!;
      const t = h.tokenIds[Math.floor(Math.random() * h.tokenIds.length)];
      s.recordSignal(w, t);
    }, 8000);
    // Sweep expired pendings every minute
    setInterval(() => s.sweepExpired(), 60_000);
  }
  g.__freelons_store = s;
}

export const store: Store = g.__freelons_store;
