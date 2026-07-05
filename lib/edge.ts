// Bridge to the Edge trading agent. SERVER-ONLY: the read token never reaches the
// browser. Edge is treated as an information source — we pull ONE objective-market
// probability per cycle and (later) read the public outcome. No trading, no money.
//
// If EDGE_API_URL is unset or Edge is unreachable, we fall back to a fixture so the
// Oracle Ledger is fully runnable/testable without a live Edge.

export type EdgeCandidate = {
  marketId: string;      // Polymarket conditionId (or fixture id)
  marketTitle: string;
  domain: string;        // objective domains only: sports / crypto / ...
  edgeProbYes: number;   // Edge's YES probability, 0..1
  edgeConfidence: number;
  source: "edge" | "fixture";
};

const OBJECTIVE_DOMAINS = new Set(["sports", "crypto", "weather", "finance", "macro"]);

function env(k: string): string | undefined {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
}

/** Pull the day's duel candidate from Edge: the strongest OBJECTIVE-market signal. */
export async function fetchDailyCandidate(): Promise<EdgeCandidate> {
  const base = env("EDGE_API_URL");
  const token = env("EDGE_READ_TOKEN");
  if (base) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/api/signals?status=pending&limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const rows: any[] = await r.json();
        const pick = (Array.isArray(rows) ? rows : [])
          .filter((s) => s && s.p_domain != null && OBJECTIVE_DOMAINS.has(String(s.domain)))
          // most confident, most decisive
          .sort((a, b) =>
            (Number(b.p_domain_confidence ?? 0) - Number(a.p_domain_confidence ?? 0)) ||
            (Math.abs(Number(b.p_domain) - 0.5) - Math.abs(Number(a.p_domain) - 0.5)))[0];
        if (pick) {
          return {
            marketId: String(pick.condition_id || pick.market_id),
            marketTitle: String(pick.title || pick.market_id),
            domain: String(pick.domain),
            edgeProbYes: clampP(Number(pick.p_domain)),
            edgeConfidence: clampP(Number(pick.p_domain_confidence ?? 0.5)),
            source: "edge",
          };
        }
      }
    } catch (e) {
      console.error("edge.fetchDailyCandidate:", (e as any)?.message);
    }
  }
  return fixtureCandidate();
}

function clampP(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(0.99, Math.max(0.01, x));
}

// A rotating, plausible objective-market fixture so the game runs with no live Edge.
const FIXTURES: Omit<EdgeCandidate, "source">[] = [
  { marketId: "fixture-btc-week", marketTitle: "Will BTC close above $70k this Friday?", domain: "crypto", edgeProbYes: 0.58, edgeConfidence: 0.44 },
  { marketId: "fixture-lakers-ml", marketTitle: "Lakers to win tonight (moneyline)?", domain: "sports", edgeProbYes: 0.63, edgeConfidence: 0.52 },
  { marketId: "fixture-eth-3800", marketTitle: "Will ETH be above $3,800 at month end?", domain: "crypto", edgeProbYes: 0.47, edgeConfidence: 0.38 },
  { marketId: "fixture-cpi-under", marketTitle: "Will next CPI print come in under forecast?", domain: "macro", edgeProbYes: 0.54, edgeConfidence: 0.30 },
];
function fixtureCandidate(): EdgeCandidate {
  // deterministic-ish rotation by day so a given day shows a stable market
  const day = Math.floor(Date.now() / (24 * 3600 * 1000));
  const f = FIXTURES[day % FIXTURES.length];
  return { ...f, source: "fixture" };
}

/**
 * Read a market's real outcome from Polymarket's public APIs (no auth). Returns
 * "YES"/"NO" once settled, else null. Fixture markets never auto-resolve (admin only).
 */
export async function resolveOutcome(marketId: string): Promise<"YES" | "NO" | null> {
  if (marketId.startsWith("fixture-")) return null;
  // CLOB market: closed + winning token
  try {
    const r = await fetch(`https://clob.polymarket.com/markets/${encodeURIComponent(marketId)}`, {
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d: any = await r.json();
      if (d?.closed && Array.isArray(d.tokens)) {
        const win = d.tokens.find((t: any) => t.winner === true);
        const o = String(win?.outcome || "").toUpperCase();
        if (o === "YES" || o === "NO") return o as "YES" | "NO";
      }
    }
  } catch { /* fall through */ }
  // Gamma fallback
  try {
    const r = await fetch(`https://gamma-api.polymarket.com/markets?condition_id=${encodeURIComponent(marketId)}&limit=1`, {
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const arr: any[] = await r.json();
      const m = arr?.[0];
      if (m?.resolved) {
        const o = String(m.resolution || "").toUpperCase();
        if (o === "YES" || o === "NO") return o as "YES" | "NO";
      }
    }
  } catch { /* ignore */ }
  return null;
}
