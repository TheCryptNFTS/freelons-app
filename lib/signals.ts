// Off-chain signal registry.
// Maps tokenId -> handle + sector + signal status (RISING / SPIKING / QUIET).
// Status flips on a schedule to feel alive. Real X data could replace this later.
import fs from "fs";
import path from "path";

export type SignalStatus = "RISING" | "SPIKING" | "QUIET";

export type TrackedToken = {
  tokenId: number;
  handle: string;        // "@example"
  sector: string;        // "CRYPTO" | "NFT" | "TECH" | "MEME" | "X / PRODUCT"
  status: SignalStatus;
  lastSpikeAgoHours: number;
  activity: "VERY HIGH" | "HIGH" | "MEDIUM" | "LOW";
  lastFlipped: number;
};

// Seed list — start small per strategy doc. Add more later.
const SEED: Omit<TrackedToken, "lastFlipped">[] = [
  { tokenId: 21,   handle: "@threadguy",   sector: "NFT",          status: "SPIKING", lastSpikeAgoHours: 1, activity: "VERY HIGH" },
  { tokenId: 42,   handle: "@cobie",       sector: "CRYPTO",       status: "RISING",  lastSpikeAgoHours: 3, activity: "HIGH" },
  { tokenId: 444,  handle: "@nikitabier",  sector: "X / PRODUCT",  status: "RISING",  lastSpikeAgoHours: 2, activity: "HIGH" },
];

const DB_PATH = path.join(process.cwd(), ".data", "signals.json");

class Registry {
  byToken = new Map<number, TrackedToken>();

  constructor() { this.load(); }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as TrackedToken[];
        for (const t of raw) this.byToken.set(t.tokenId, t);
      } else {
        this.seed();
      }
    } catch (e) {
      console.error("signals load:", e);
      this.seed();
    }
  }

  save() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(Array.from(this.byToken.values()), null, 2));
    } catch (e) { console.error("signals save:", e); }
  }

  seed() {
    const now = Date.now();
    for (const t of SEED) {
      this.byToken.set(t.tokenId, { ...t, lastFlipped: now });
    }
    this.save();
  }

  forToken(tokenId: number): TrackedToken | null {
    return this.byToken.get(tokenId) || null;
  }

  byHandle(handle: string): TrackedToken | null {
    const h = handle.startsWith("@") ? handle : "@" + handle;
    for (const t of this.byToken.values()) {
      if (t.handle.toLowerCase() === h.toLowerCase()) return t;
    }
    return null;
  }

  all() {
    return Array.from(this.byToken.values());
  }

  // Flip status on schedule. Each token flips every 4-12h randomly.
  tick() {
    const now = Date.now();
    let changed = false;
    for (const t of this.byToken.values()) {
      const ageHours = (now - t.lastFlipped) / (3600 * 1000);
      const flipAt = 4 + Math.random() * 8; // 4-12h
      if (ageHours >= flipAt) {
        // weighted: mostly RISING, occasional SPIKING/QUIET
        const r = Math.random();
        const next: SignalStatus = r < 0.15 ? "SPIKING" : r < 0.55 ? "RISING" : "QUIET";
        t.status = next;
        t.lastSpikeAgoHours = next === "SPIKING" ? 0 : Math.max(1, Math.floor(Math.random() * 12));
        t.activity = next === "SPIKING" ? "VERY HIGH" : next === "RISING" ? "HIGH" : "MEDIUM";
        t.lastFlipped = now;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Add or update a tracked token (admin only)
  upsert(t: Omit<TrackedToken, "lastFlipped">) {
    this.byToken.set(t.tokenId, { ...t, lastFlipped: Date.now() });
    this.save();
  }
}

const g = globalThis as any;
if (!g.__freelons_signals) {
  const r = new Registry();
  // Tick every minute
  setInterval(() => r.tick(), 60_000);
  g.__freelons_signals = r;
}

export const signals: Registry = g.__freelons_signals;
