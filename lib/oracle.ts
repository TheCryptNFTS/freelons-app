// THE ORACLE LEDGER — calibration-scored "beat the AI" game.
//
// Design invariant: HEX is NON-CASHABLE POINTS. Nothing here moves real money,
// takes custody, quotes returns, or auto-trades. Markets are resolved by public
// outcomes (Polymarket), never by us. This is a skill/entertainment game over a
// published information feed. Keep it that way.
//
// Two coexisting layers per Duel:
//   1) POT (engagement): pari-mutuel FOLLOW/FADE on whether Edge's called side wins.
//   2) CALIBRATION (skill): each stance's own probability is Brier-scored vs the
//      real outcome and accrues to the acting citizen's Analyst Rating. This is the
//      un-luckable ladder that (later) gates the real-markets door.
import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Side = "YES" | "NO";
export type Stake = "FOLLOW" | "FADE";
export type DuelStatus = "open" | "locked" | "resolved" | "void";

export type Duel = {
  id: string;
  marketId: string;
  marketTitle: string;
  domain: string;            // Edge's domain tag (sports/crypto/…) — objective only
  edgeProbYes: number;       // Edge's sealed probability of YES, 0..1
  edgeSide: Side;            // the side Edge favors (YES if edgeProbYes >= .5)
  edgeConfidence: number;    // 0..1, for the Contrarian Bell later
  sealHash: string;          // commits {market,prob,side,lock} BEFORE resolution
  publishedAt: number;
  lockTs: number;            // stances close here
  status: DuelStatus;
  outcome: Side | null;      // set on resolve
  outcomeSource?: string;
  resolvedAt?: number;
  edgeBrier?: number;        // Edge's own Brier this duel (shown publicly)
  pot: { follow: number; fade: number }; // HEX staked each side
};

export type Stance = {
  id: string;
  duelId: string;
  wallet: string;
  tokenId: number;
  stake: Stake;              // FOLLOW = bet Edge's side wins; FADE = bet it loses
  ownProbYes: number;        // holder's own YES probability, 0..1 (skill input)
  hex: number;               // HEX staked into the pot
  placedAt: number;
  settled: boolean;
  payout?: number;           // HEX returned on settle (0 if lost)
  brier?: number;            // holder's Brier this duel
  beatEdge?: boolean;
};

export type Rating = {
  tokenId: number;
  owner: string;             // last seen owner (rating resets on transfer)
  resolved: number;          // # resolved duels this citizen forecasted
  sumBrier: number;          // Σ holder Brier (lower better)
  sumEdgeBrier: number;      // Σ Edge Brier over the same duels
  beatEdgeCount: number;
  byDomain: Record<string, { resolved: number; sumBrier: number }>;
  updatedAt: number;
};

const DB_PATH = path.join(process.cwd(), ".data", "oracle.json");

// ---- economy knobs (env-overridable) ----
const HEX_START = num(process.env.ORACLE_HEX_START, 1000);
const HEX_DAILY = num(process.env.ORACLE_HEX_DAILY, 100); // participation backstop
const HEX_MIN_STAKE = num(process.env.ORACLE_HEX_MIN, 10);
const HEX_MAX_STAKE = num(process.env.ORACLE_HEX_MAX, 500);
function num(v: string | undefined, d: number) { const n = Number(v); return Number.isFinite(n) ? n : d; }

// ---- pure scoring (exported for tests) ----
/** Brier score of a YES-probability against a boolean outcome. 0 = perfect, 1 = worst. */
export function brier(probYes: number, outcomeYes: boolean): number {
  const p = clamp01(probYes);
  const o = outcomeYes ? 1 : 0;
  return (p - o) * (p - o);
}
export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(1, Math.max(0, x));
}
/** Did the given stake win the pari-mutuel? FOLLOW wins iff Edge's side was the outcome. */
export function stakeWon(stake: Stake, edgeSide: Side, outcome: Side): boolean {
  const edgeRight = edgeSide === outcome;
  return stake === "FOLLOW" ? edgeRight : !edgeRight;
}
/**
 * Pari-mutuel payout: winners split the losing pool pro-rata to their stake, plus
 * their own stake back. If a side is empty, winners just get their stake back (no
 * house). Returns a map stanceId -> payout.
 */
export function settlePot(stances: Stance[], edgeSide: Side, outcome: Side): Map<string, number> {
  const winners = stances.filter((s) => stakeWon(s.stake, edgeSide, outcome));
  const losers = stances.filter((s) => !stakeWon(s.stake, edgeSide, outcome));
  const winPool = winners.reduce((a, s) => a + s.hex, 0);
  const losePool = losers.reduce((a, s) => a + s.hex, 0);
  const out = new Map<string, number>();
  for (const s of losers) out.set(s.id, 0);
  for (const s of winners) {
    const share = winPool > 0 ? s.hex / winPool : 0;
    out.set(s.id, s.hex + Math.floor(losePool * share));
  }
  return out;
}
/** Analyst letter grade from average Brier and edge-relative performance. */
export function ratingGrade(r: Rating): string {
  if (r.resolved < 5) return "UNRANKED";
  const avg = r.sumBrier / r.resolved;
  const edgeAvg = r.sumEdgeBrier / r.resolved;
  const beatsEdge = avg < edgeAvg;
  // Lower Brier is better. Bands are calibrated for binary markets (0..0.25 typical).
  let base: string;
  if (avg <= 0.10) base = "A";
  else if (avg <= 0.16) base = "B";
  else if (avg <= 0.22) base = "C";
  else if (avg <= 0.25) base = "D";
  else base = "F";
  const sign = beatsEdge ? "+" : "";
  return base + sign;
}

class OracleStore {
  duels: Duel[] = [];
  stances: Stance[] = [];
  ratings = new Map<number, Rating>();
  hex = new Map<string, { balance: number; lastFaucet: number }>();
  rateBucket = new Map<string, number[]>();

  constructor() { this.load(); }

  private load() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(DB_PATH)) {
        const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
        this.duels = raw.duels || [];
        this.stances = raw.stances || [];
        this.ratings = new Map((raw.ratings || []).map((r: Rating) => [r.tokenId, r]));
        this.hex = new Map(Object.entries(raw.hex || {}));
      }
    } catch (e) { console.error("oracle.load:", e); }
  }
  private save() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const body = JSON.stringify({
        duels: this.duels.slice(0, 400),
        stances: this.stances.slice(-20000),
        ratings: Array.from(this.ratings.values()),
        hex: Object.fromEntries(this.hex),
      });
      // Atomic write: temp + rename so a crash mid-write can't corrupt the ledger.
      const tmp = DB_PATH + ".tmp";
      fs.writeFileSync(tmp, body);
      fs.renameSync(tmp, DB_PATH);
    } catch (e) { console.error("oracle.save:", e); }
  }

  // ---- HEX (non-cashable points) ----
  hexBalance(wallet: string): number {
    const w = wallet.toLowerCase();
    let rec = this.hex.get(w);
    if (!rec) { rec = { balance: HEX_START, lastFaucet: 0 }; this.hex.set(w, rec); this.save(); }
    return rec.balance;
  }
  /** Daily HEX allowance (participation backstop against thin pots). Idempotent per day. */
  claimDaily(wallet: string): { claimed: boolean; balance: number } {
    const w = wallet.toLowerCase();
    const rec = this.hex.get(w) || { balance: HEX_START, lastFaucet: 0 };
    const dayMs = 24 * 3600 * 1000;
    if (Date.now() - rec.lastFaucet >= dayMs) {
      rec.balance += HEX_DAILY;
      rec.lastFaucet = Date.now();
      this.hex.set(w, rec);
      this.save();
      return { claimed: true, balance: rec.balance };
    }
    this.hex.set(w, rec);
    return { claimed: false, balance: rec.balance };
  }
  private addHex(wallet: string, delta: number) {
    const w = wallet.toLowerCase();
    const rec = this.hex.get(w) || { balance: HEX_START, lastFaucet: 0 };
    rec.balance = Math.max(0, rec.balance + delta);
    this.hex.set(w, rec);
  }

  rateLimit(wallet: string) {
    const now = Date.now();
    const arr = (this.rateBucket.get(wallet) || []).filter((t) => now - t < 60_000);
    if (arr.length >= 8) return { ok: false, retryIn: Math.ceil((arr[0] + 60_000 - now) / 1000) };
    arr.push(now); this.rateBucket.set(wallet, arr);
    return { ok: true, retryIn: 0 };
  }

  // ---- duels ----
  currentDuel(): Duel | null {
    // newest non-void duel
    return this.duels.find((d) => d.status !== "void") || null;
  }
  duelById(id: string): Duel | null { return this.duels.find((d) => d.id === id) || null; }

  publishDuel(input: {
    marketId: string; marketTitle: string; domain: string;
    edgeProbYes: number; edgeConfidence?: number; lockInMinutes?: number;
  }): Duel {
    const edgeProbYes = clamp01(input.edgeProbYes);
    const lockTs = Date.now() + (input.lockInMinutes ?? 24 * 60) * 60_000;
    const edgeSide: Side = edgeProbYes >= 0.5 ? "YES" : "NO";
    const salt = crypto.randomBytes(8).toString("hex");
    // Commit Edge's call BEFORE anyone can see the outcome — the receipt's trust anchor.
    const sealHash = "OL" + crypto.createHash("sha256")
      .update([input.marketId, edgeProbYes.toFixed(6), edgeSide, String(lockTs), salt].join("|"))
      .digest("hex").slice(0, 10).toUpperCase();
    const duel: Duel = {
      id: crypto.randomBytes(6).toString("hex"),
      marketId: input.marketId,
      marketTitle: input.marketTitle,
      domain: input.domain,
      edgeProbYes,
      edgeSide,
      edgeConfidence: clamp01(input.edgeConfidence ?? Math.abs(edgeProbYes - 0.5) * 2),
      sealHash,
      publishedAt: Date.now(),
      lockTs,
      status: "open",
      outcome: null,
      pot: { follow: 0, fade: 0 },
    };
    this.duels.unshift(duel);
    this.save();
    return duel;
  }

  /** Transition open→locked once past lockTs (call from read paths / cron). */
  tickLocks() {
    let changed = false;
    for (const d of this.duels) {
      if (d.status === "open" && Date.now() >= d.lockTs) { d.status = "locked"; changed = true; }
    }
    if (changed) this.save();
  }

  stanceFor(duelId: string, wallet: string): Stance | null {
    const w = wallet.toLowerCase();
    return this.stances.find((s) => s.duelId === duelId && s.wallet === w) || null;
  }
  stancesForDuel(duelId: string): Stance[] { return this.stances.filter((s) => s.duelId === duelId); }

  placeStance(input: {
    duelId: string; wallet: string; tokenId: number; stake: Stake; ownProbYes: number; hex: number;
  }): { ok: true; stance: Stance } | { ok: false; error: string; detail?: any } {
    const d = this.duelById(input.duelId);
    if (!d) return { ok: false, error: "duel_not_found" };
    this.tickLocks();
    if (d.status !== "open") return { ok: false, error: "duel_locked" };
    if (Date.now() >= d.lockTs) return { ok: false, error: "duel_locked" };
    const wallet = input.wallet.toLowerCase();
    if (this.stanceFor(input.duelId, wallet)) return { ok: false, error: "already_staked" };
    const hex = Math.floor(input.hex);
    if (!(hex >= HEX_MIN_STAKE && hex <= HEX_MAX_STAKE)) return { ok: false, error: "bad_stake", detail: { min: HEX_MIN_STAKE, max: HEX_MAX_STAKE } };
    if (this.hexBalance(wallet) < hex) return { ok: false, error: "insufficient_hex" };
    const stake: Stake = input.stake === "FADE" ? "FADE" : "FOLLOW";

    this.addHex(wallet, -hex);
    if (stake === "FOLLOW") d.pot.follow += hex; else d.pot.fade += hex;
    const stance: Stance = {
      id: crypto.randomBytes(6).toString("hex"),
      duelId: input.duelId, wallet, tokenId: Math.floor(input.tokenId),
      stake, ownProbYes: clamp01(input.ownProbYes), hex,
      placedAt: Date.now(), settled: false,
    };
    this.stances.push(stance);
    this.save();
    return { ok: true, stance };
  }

  /**
   * Resolve a locked duel against a real outcome. Settles the HEX pot, scores every
   * stance on Brier, pays calibration bonuses for beating Edge, and updates the
   * per-citizen Analyst Ratings. Idempotent.
   */
  resolveDuel(duelId: string, outcome: Side, source = "manual", ownerOf?: Map<number, string>):
    { ok: true; duel: Duel; settled: number } | { ok: false; error: string } {
    const d = this.duelById(duelId);
    if (!d) return { ok: false, error: "duel_not_found" };
    if (d.status === "resolved") return { ok: true, duel: d, settled: 0 };
    d.status = "resolved";
    d.outcome = outcome;
    d.outcomeSource = source;
    d.resolvedAt = Date.now();
    d.edgeBrier = brier(d.edgeProbYes, outcome === "YES");

    const stances = this.stancesForDuel(duelId).filter((s) => !s.settled);
    const payouts = settlePot(stances, d.edgeSide, outcome);
    for (const s of stances) {
      const payout = payouts.get(s.id) ?? 0;
      s.settled = true;
      s.payout = payout;
      s.brier = brier(s.ownProbYes, outcome === "YES");
      s.beatEdge = s.brier < (d.edgeBrier ?? 1);
      if (payout > 0) this.addHex(s.wallet, payout);
      // NOTE: no per-duel HEX is MINTED for beating Edge. A single lucky extreme
      // guess (0.999/0.001) beats Edge's Brier ~half the time regardless of the
      // outcome, so a mint here is farmable with zero skill. HEX only ever moves
      // via the zero-sum pari-mutuel pot; "beat Edge" is a reputation stat only,
      // rewarded through leaderboard rank (avg Brier), which extreme-guessing loses.
      this.updateRating(s, d, ownerOf?.get(s.tokenId));
    }
    this.save();
    return { ok: true, duel: d, settled: stances.length };
  }

  /** Void a duel (e.g. market never settles) and REFUND every unsettled stake. */
  voidDuel(duelId: string): { ok: true; refunded: number } | { ok: false; error: string } {
    const d = this.duelById(duelId);
    if (!d) return { ok: false, error: "duel_not_found" };
    if (d.status === "resolved") return { ok: false, error: "already_resolved" };
    let refunded = 0;
    for (const s of this.stancesForDuel(duelId)) {
      if (!s.settled) { this.addHex(s.wallet, s.hex); s.settled = true; s.payout = s.hex; refunded++; }
    }
    d.status = "void";
    this.save();
    return { ok: true, refunded };
  }

  private updateRating(s: Stance, d: Duel, currentOwner?: string) {
    let r = this.ratings.get(s.tokenId);
    const owner = (currentOwner || s.wallet).toLowerCase();
    // Reputation is bonded to the token and RESETS on transfer (anti-sybil).
    if (!r || r.owner !== owner) {
      r = { tokenId: s.tokenId, owner, resolved: 0, sumBrier: 0, sumEdgeBrier: 0, beatEdgeCount: 0, byDomain: {}, updatedAt: 0 };
    }
    r.resolved += 1;
    r.sumBrier += s.brier ?? 0;
    r.sumEdgeBrier += d.edgeBrier ?? 0;
    if (s.beatEdge) r.beatEdgeCount += 1;
    const dom = r.byDomain[d.domain] || { resolved: 0, sumBrier: 0 };
    dom.resolved += 1; dom.sumBrier += s.brier ?? 0;
    r.byDomain[d.domain] = dom;
    r.updatedAt = Date.now();
    this.ratings.set(s.tokenId, r);
  }

  ratingFor(tokenId: number): (Rating & { grade: string; avgBrier: number | null }) | null {
    const r = this.ratings.get(tokenId);
    if (!r) return null;
    return { ...r, grade: ratingGrade(r), avgBrier: r.resolved ? r.sumBrier / r.resolved : null };
  }

  /** Calibration leaderboard: citizens ranked by beating Edge, then lower avg Brier. */
  leaderboard(n = 100) {
    return Array.from(this.ratings.values())
      .filter((r) => r.resolved >= 5)
      .map((r) => ({
        tokenId: r.tokenId, owner: r.owner, resolved: r.resolved,
        avgBrier: r.sumBrier / r.resolved, edgeAvgBrier: r.sumEdgeBrier / r.resolved,
        beatEdgeCount: r.beatEdgeCount, grade: ratingGrade(r),
      }))
      // Primary sort is LOWER average Brier — a proper scoring rule. Extreme
      // guessing (0.999/0.001) yields avg Brier ~0.5 and sinks to the bottom, so
      // the ladder can't be farmed by luck; beat-Edge ratio only breaks ties.
      .sort((a, b) => (a.avgBrier - b.avgBrier) || (b.beatEdgeCount / b.resolved - a.beatEdgeCount / a.resolved))
      .slice(0, n);
  }

  /** Crowd-vs-Machine: HEX-weighted crowd probability vs Edge, over resolved duels. */
  crowdVsMachine() {
    const resolved = this.duels.filter((d) => d.status === "resolved" && d.outcome);
    let crowdBrierSum = 0, edgeBrierSum = 0, n = 0;
    for (const d of resolved) {
      const ss = this.stancesForDuel(d.id);
      if (ss.length === 0) continue;
      const wsum = ss.reduce((a, s) => a + s.hex, 0) || ss.length;
      const crowdP = ss.reduce((a, s) => a + s.ownProbYes * (s.hex || 1), 0) / wsum;
      crowdBrierSum += brier(crowdP, d.outcome === "YES");
      edgeBrierSum += d.edgeBrier ?? brier(d.edgeProbYes, d.outcome === "YES");
      n++;
    }
    return n ? { duels: n, crowdAvgBrier: crowdBrierSum / n, edgeAvgBrier: edgeBrierSum / n, crowdWins: crowdBrierSum < edgeBrierSum } : null;
  }
}

const g = globalThis as any;
if (!g.__oracle_store) g.__oracle_store = new OracleStore();
export const oracle: OracleStore = g.__oracle_store;
