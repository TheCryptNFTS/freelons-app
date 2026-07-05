// THE ORACLE LEDGER — calibration-scored "beat the AI" game, backed by Supabase
// Postgres so it survives serverless (no in-process state, no file store).
//
// Invariant: HEX is NON-CASHABLE POINTS. Nothing here moves real money, takes
// custody, quotes returns, or auto-trades. Outcomes settle on PUBLIC markets.
// The money-critical operations (stake debit, pari-mutuel settlement, faucet,
// void refund) are ATOMIC Postgres functions (see the oracle_* RPCs); this module
// is a thin, authenticated data layer over them.
import crypto from "crypto";
import { db } from "./supabase";

export type Side = "YES" | "NO";
export type Stake = "FOLLOW" | "FADE";
export type DuelStatus = "open" | "locked" | "resolved" | "void";

export type Duel = {
  id: string; marketId: string; marketTitle: string; domain: string;
  edgeProbYes: number; edgeSide: Side; edgeConfidence: number; sealHash: string;
  publishedAt: number; lockTs: number; status: DuelStatus;
  outcome: Side | null; outcomeSource?: string; resolvedAt?: number;
  edgeBrier?: number | null; pot: { follow: number; fade: number };
};
export type Stance = {
  id: string; duelId: string; wallet: string; tokenId: number; stake: Stake;
  ownProbYes: number; hex: number; placedAt: number; settled: boolean;
  payout?: number | null; brier?: number | null; beatEdge?: boolean | null;
};
export type Rating = {
  tokenId: number; owner: string; resolved: number; sumBrier: number;
  sumEdgeBrier: number; beatEdgeCount: number;
  byDomain: Record<string, { resolved: number; sumBrier: number }>; updatedAt: number;
};

// ---- economy knobs (must match the SQL defaults passed into the RPCs) ----
function num(v: string | undefined, d: number) { const n = Number(v); return Number.isFinite(n) ? n : d; }
const HEX_START = num(process.env.ORACLE_HEX_START, 1000);
const HEX_DAILY = num(process.env.ORACLE_HEX_DAILY, 100);
const HEX_MIN_STAKE = num(process.env.ORACLE_HEX_MIN, 10);
const HEX_MAX_STAKE = num(process.env.ORACLE_HEX_MAX, 500);

// ---- pure scoring (exported for unit tests; the DB mirrors this exactly) ----
export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(1, Math.max(0, x));
}
/** Brier score of a YES-probability against a boolean outcome. 0 = perfect, 1 = worst. */
export function brier(probYes: number, outcomeYes: boolean): number {
  const p = clamp01(probYes); const o = outcomeYes ? 1 : 0;
  return (p - o) * (p - o);
}
export function stakeWon(stake: Stake, edgeSide: Side, outcome: Side): boolean {
  const edgeRight = edgeSide === outcome;
  return stake === "FOLLOW" ? edgeRight : !edgeRight;
}
/** Pari-mutuel: winners split the losing pool pro-rata + their own stake back. */
export function settlePot(stances: Stance[], edgeSide: Side, outcome: Side): Map<string, number> {
  const winners = stances.filter((s) => stakeWon(s.stake, edgeSide, outcome));
  const losers = stances.filter((s) => !stakeWon(s.stake, edgeSide, outcome));
  const winPool = winners.reduce((a, s) => a + s.hex, 0);
  const losePool = losers.reduce((a, s) => a + s.hex, 0);
  const out = new Map<string, number>();
  for (const s of losers) out.set(s.id, 0);
  for (const s of winners) out.set(s.id, s.hex + (winPool > 0 ? Math.floor(losePool * (s.hex / winPool)) : 0));
  return out;
}
export function ratingGrade(r: Rating): string {
  if (r.resolved < 5) return "UNRANKED";
  const avg = r.sumBrier / r.resolved;
  const beatsEdge = avg < r.sumEdgeBrier / r.resolved;
  const base = avg <= 0.10 ? "A" : avg <= 0.16 ? "B" : avg <= 0.22 ? "C" : avg <= 0.25 ? "D" : "F";
  return base + (beatsEdge ? "+" : "");
}

// ---- row <-> object mapping ----
const rid = () => crypto.randomBytes(6).toString("hex");
function toDuel(r: any): Duel {
  return {
    id: r.id, marketId: r.market_id, marketTitle: r.market_title, domain: r.domain,
    edgeProbYes: Number(r.edge_prob_yes), edgeSide: r.edge_side, edgeConfidence: Number(r.edge_confidence),
    sealHash: r.seal_hash, publishedAt: Number(r.published_at), lockTs: Number(r.lock_ts),
    status: r.status, outcome: r.outcome ?? null, outcomeSource: r.outcome_source ?? undefined,
    resolvedAt: r.resolved_at ?? undefined, edgeBrier: r.edge_brier ?? null,
    pot: { follow: Number(r.pot_follow), fade: Number(r.pot_fade) },
  };
}
function toRating(r: any): Rating {
  return {
    tokenId: Number(r.token_id), owner: r.owner, resolved: Number(r.resolved),
    sumBrier: Number(r.sum_brier), sumEdgeBrier: Number(r.sum_edge_brier),
    beatEdgeCount: Number(r.beat_edge_count), byDomain: r.by_domain || {}, updatedAt: Number(r.updated_at),
  };
}

export const oracle = {
  async tickLocks(): Promise<void> {
    await db().rpc("oracle_tick_locks");
  },

  async currentDuel(): Promise<Duel | null> {
    await this.tickLocks();
    const { data } = await db().from("oracle_duels").select("*").neq("status", "void")
      .order("published_at", { ascending: false }).limit(1);
    return data && data[0] ? toDuel(data[0]) : null;
  },
  async duelById(id: string): Promise<Duel | null> {
    const { data } = await db().from("oracle_duels").select("*").eq("id", id).maybeSingle();
    return data ? toDuel(data) : null;
  },

  async publishDuel(input: {
    marketId: string; marketTitle: string; domain: string;
    edgeProbYes: number; edgeConfidence?: number; lockInMinutes?: number;
  }): Promise<Duel> {
    const edgeProbYes = clamp01(input.edgeProbYes);
    const lockTs = Date.now() + (input.lockInMinutes ?? 24 * 60) * 60_000;
    const edgeSide: Side = edgeProbYes >= 0.5 ? "YES" : "NO";
    const salt = crypto.randomBytes(8).toString("hex");
    const sealHash = "OL" + crypto.createHash("sha256")
      .update([input.marketId, edgeProbYes.toFixed(6), edgeSide, String(lockTs), salt].join("|"))
      .digest("hex").slice(0, 10).toUpperCase();
    const row = {
      id: rid(), market_id: input.marketId, market_title: input.marketTitle, domain: input.domain,
      edge_prob_yes: edgeProbYes, edge_side: edgeSide,
      edge_confidence: clamp01(input.edgeConfidence ?? Math.abs(edgeProbYes - 0.5) * 2),
      seal_hash: sealHash, published_at: Date.now(), lock_ts: lockTs, status: "open",
      pot_follow: 0, pot_fade: 0,
    };
    const { data, error } = await db().from("oracle_duels").insert(row).select().single();
    if (error) throw new Error("publish_failed: " + error.message);
    return toDuel(data);
  },

  async stancesForDuel(duelId: string): Promise<Stance[]> {
    const { data } = await db().from("oracle_stances").select("*").eq("duel_id", duelId);
    return (data || []).map((r: any) => ({
      id: r.id, duelId: r.duel_id, wallet: r.wallet, tokenId: Number(r.token_id), stake: r.stake,
      ownProbYes: Number(r.own_prob_yes), hex: Number(r.hex), placedAt: Number(r.placed_at),
      settled: r.settled, payout: r.payout, brier: r.brier, beatEdge: r.beat_edge,
    }));
  },
  async stanceFor(duelId: string, wallet: string): Promise<Stance | null> {
    const { data } = await db().from("oracle_stances").select("*")
      .eq("duel_id", duelId).eq("wallet", wallet.toLowerCase()).maybeSingle();
    if (!data) return null;
    return {
      id: data.id, duelId: data.duel_id, wallet: data.wallet, tokenId: Number(data.token_id), stake: data.stake,
      ownProbYes: Number(data.own_prob_yes), hex: Number(data.hex), placedAt: Number(data.placed_at),
      settled: data.settled, payout: data.payout, brier: data.brier, beatEdge: data.beat_edge,
    };
  },

  async hexBalance(wallet: string): Promise<number> {
    const { data } = await db().from("oracle_hex").select("balance").eq("wallet", wallet.toLowerCase()).maybeSingle();
    return data ? Number(data.balance) : HEX_START;
  },
  async claimDaily(wallet: string): Promise<{ claimed: boolean; balance: number }> {
    const { data, error } = await db().rpc("oracle_claim_daily", {
      p_wallet: wallet.toLowerCase(), p_daily: HEX_DAILY, p_start: HEX_START,
    });
    if (error) throw new Error(error.message);
    return { claimed: !!data?.claimed, balance: Number(data?.balance ?? HEX_START) };
  },

  async placeStance(input: {
    duelId: string; wallet: string; tokenId: number; stake: Stake; ownProbYes: number; hex: number;
  }): Promise<{ ok: true; stance: Stance; hexBalance: number } | { ok: false; error: string; detail?: any }> {
    const { data, error } = await db().rpc("oracle_place_stance", {
      p_id: rid(), p_duel: input.duelId, p_wallet: input.wallet.toLowerCase(), p_token: Math.floor(input.tokenId),
      p_stake: input.stake, p_prob: clamp01(input.ownProbYes), p_hex: Math.floor(input.hex),
      p_hex_start: HEX_START, p_min: HEX_MIN_STAKE, p_max: HEX_MAX_STAKE,
    });
    if (error) return { ok: false, error: "db_error", detail: error.message };
    if (!data || !data.ok) return { ok: false, error: data?.error || "error", detail: data?.detail };
    return { ok: true, stance: data.stance, hexBalance: Number(data.hexBalance) };
  },

  async resolveDuel(duelId: string, outcome: Side, source = "manual"):
    Promise<{ ok: true; duel: Duel; settled: number } | { ok: false; error: string }> {
    const { data, error } = await db().rpc("oracle_resolve_duel", { p_duel: duelId, p_outcome: outcome, p_source: source });
    if (error) return { ok: false, error: error.message };
    if (!data || !data.ok) return { ok: false, error: data?.error || "resolve_failed" };
    const duel = await this.duelById(duelId);
    return { ok: true, duel: duel as Duel, settled: Number(data.settled) };
  },

  async voidDuel(duelId: string): Promise<{ ok: true; refunded: number } | { ok: false; error: string }> {
    const { data, error } = await db().rpc("oracle_void_duel", { p_duel: duelId });
    if (error) return { ok: false, error: error.message };
    if (!data || !data.ok) return { ok: false, error: data?.error || "void_failed" };
    return { ok: true, refunded: Number(data.refunded) };
  },

  async ratingFor(tokenId: number): Promise<(Rating & { grade: string; avgBrier: number | null }) | null> {
    const { data } = await db().from("oracle_ratings").select("*").eq("token_id", tokenId).maybeSingle();
    if (!data) return null;
    const r = toRating(data);
    return { ...r, grade: ratingGrade(r), avgBrier: r.resolved ? r.sumBrier / r.resolved : null };
  },

  async leaderboard(n = 100) {
    const { data } = await db().from("oracle_ratings").select("*").gte("resolved", 5);
    return (data || []).map(toRating).map((r) => ({
      tokenId: r.tokenId, owner: r.owner, resolved: r.resolved,
      avgBrier: r.sumBrier / r.resolved, edgeAvgBrier: r.sumEdgeBrier / r.resolved,
      beatEdgeCount: r.beatEdgeCount, grade: ratingGrade(r),
    }))
      // Lowest average Brier first — extreme-guessing (~0.5 avg) sinks; ratio breaks ties.
      .sort((a, b) => (a.avgBrier - b.avgBrier) || (b.beatEdgeCount / b.resolved - a.beatEdgeCount / a.resolved))
      .slice(0, n);
  },

  async crowdVsMachine() {
    const { data: duels } = await db().from("oracle_duels").select("*")
      .eq("status", "resolved").order("resolved_at", { ascending: false }).limit(60);
    const resolved = (duels || []).filter((d: any) => d.outcome);
    if (resolved.length === 0) return null;
    const ids = resolved.map((d: any) => d.id);
    const { data: stances } = await db().from("oracle_stances").select("duel_id,own_prob_yes,hex").in("duel_id", ids);
    const byDuel = new Map<string, any[]>();
    for (const s of stances || []) { const a = byDuel.get(s.duel_id) || []; a.push(s); byDuel.set(s.duel_id, a); }
    let crowd = 0, edge = 0, n = 0;
    for (const d of resolved) {
      const ss = byDuel.get(d.id) || [];
      if (ss.length === 0) continue;
      const wsum = ss.reduce((a, s) => a + Number(s.hex), 0) || ss.length;
      const crowdP = ss.reduce((a, s) => a + Number(s.own_prob_yes) * (Number(s.hex) || 1), 0) / wsum;
      crowd += brier(crowdP, d.outcome === "YES");
      edge += d.edge_brier != null ? Number(d.edge_brier) : brier(Number(d.edge_prob_yes), d.outcome === "YES");
      n++;
    }
    return n ? { duels: n, crowdAvgBrier: crowd / n, edgeAvgBrier: edge / n, crowdWins: crowd < edge } : null;
  },
};
