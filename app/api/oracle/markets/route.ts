import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/oracle/markets — the read-only "markets Edge is watching" board.
// Pulls live binary markets from Polymarket's public Gamma API (no auth), merging
// a "hot" (24h volume) list with an "evergreen" (all-time volume) list so the
// board isn't dominated by whatever single event is loud today, drops extreme
// longshots (they read as monotonous), forces category variety, caches ~60s, and
// falls back to a fixture set so it never breaks. NEVER touches the oracle_* tables.

type Mkt = { q: string; yes: number; vol: number; chg: number; cat: string };

let cache: { at: number; data: Mkt[] } | null = null;
const TTL = 60_000;

function categorize(q: string): string {
  const s = q.toLowerCase();
  if (/trump|biden|harris|president|election|senate|congress|nominee|governor|prime minister|parliament|impeach|zelensk|putin|leader out|next leader|cabinet|minister|mamdani|newsom|\bgop\b|democrat|republican|govt|shutdown/.test(s)) return "POLITICS";
  if (/bitcoin|\bbtc\b|ethereum|\beth\b|solana|\bsol\b|crypto|\bcoin\b|token|hyperliquid|\bxrp\b|dogecoin|\bdoge\b|stablecoin|binance|\bnft\b/.test(s)) return "CRYPTO";
  if (/world cup|win on |\bvs\.?\b|\bnba\b|\bnfl\b|premier league|\bmatch\b|\bfight\b|\bufc\b|super bowl|champions|to score|\bgoal|\bf1\b|grand prix|series|playoff|\bwin the\b|relegat/.test(s)) return "SPORTS";
  if (/\bgpt\b|openai|\bai\b|\bllm\b|\bmodel\b|google|apple|tesla|nvidia|grok|gemini|anthropic|chatgpt|deepseek|\bagi\b/.test(s)) return "AI/TECH";
  if (/\bcpi\b|\bfed\b|rate cut|rate hike|\bgdp\b|inflation|recession|jobs report|unemployment|jerome powell|interest rate|s&p|nasdaq/.test(s)) return "MACRO";
  return "CULTURE";
}

const FIXTURE: Mkt[] = [
  { q: "Will BTC close above $70k this Friday?", yes: 0.58, vol: 4200000, chg: 0.03, cat: "CRYPTO" },
  { q: "Will the Fed cut rates at the next meeting?", yes: 0.41, vol: 8800000, chg: -0.05, cat: "MACRO" },
  { q: "Will next CPI print come in under forecast?", yes: 0.54, vol: 1200000, chg: 0.02, cat: "MACRO" },
  { q: "Will ETH be above $3,800 at month end?", yes: 0.47, vol: 2600000, chg: -0.02, cat: "CRYPTO" },
  { q: "Will a new AI model top the leaderboard this month?", yes: 0.63, vol: 900000, chg: 0.07, cat: "AI/TECH" },
  { q: "Will Brazil win their next match?", yes: 0.55, vol: 5100000, chg: 0.01, cat: "SPORTS" },
  { q: "Will the incumbent lead the next national poll?", yes: 0.49, vol: 3300000, chg: -0.03, cat: "POLITICS" },
  { q: "Will box office #1 exceed $60M this weekend?", yes: 0.38, vol: 480000, chg: 0.04, cat: "CULTURE" },
  { q: "Will unemployment tick up next report?", yes: 0.44, vol: 1500000, chg: 0.02, cat: "MACRO" },
  { q: "Will Nvidia set a new all-time high this month?", yes: 0.52, vol: 2100000, chg: 0.06, cat: "AI/TECH" },
  { q: "Will SOL flip $200 before quarter end?", yes: 0.29, vol: 1700000, chg: -0.04, cat: "CRYPTO" },
  { q: "Will Mexico advance in their next fixture?", yes: 0.61, vol: 990000, chg: 0.02, cat: "SPORTS" },
];

async function fetchList(order: string): Promise<any[]> {
  try {
    const r = await fetch(
      `https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=60&order=${order}&ascending=false`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch { return []; }
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ markets: cache.data, cached: true });
  }
  try {
    const [hot, big, liquid] = await Promise.all([
      fetchList("volume24hr"), fetchList("volumeNum"), fetchList("liquidityNum"),
    ]);
    const seenQ = new Set<string>();
    const parsed: Mkt[] = [];
    for (const m of [...hot, ...big, ...liquid]) {
      if (!m?.active || m?.closed) continue;
      const q = String(m.question || "");
      if (!q || seenQ.has(q)) continue;
      // skip repetitive low-value noise (exact-score permutations, half-time props, etc.)
      if (/exact score|correct score|half(?:-| )?time|1st half|2nd half|winning margin|both halves/i.test(q)) continue;
      let outcomes: any, prices: any;
      try { outcomes = JSON.parse(m.outcomes); prices = JSON.parse(m.outcomePrices); } catch { continue; }
      if (!Array.isArray(outcomes) || outcomes[0] !== "Yes" || outcomes[1] !== "No") continue;
      const yes = parseFloat(prices?.[0]);
      if (!Number.isFinite(yes) || yes < 0.03 || yes > 0.97) continue; // drop near-certain longshots
      seenQ.add(q);
      parsed.push({ q, yes, vol: Number(m.volumeNum || m.volume || 0), chg: Number(m.oneDayPriceChange || 0), cat: categorize(q) });
    }
    // force variety first: at most 6 per category, interleaved across categories
    const byCat = new Map<string, Mkt[]>();
    for (const m of parsed) {
      const l = byCat.get(m.cat) || [];
      if (l.length < 6) { l.push(m); byCat.set(m.cat, l); }
    }
    const cats = [...byCat.values()];
    const out: Mkt[] = [];
    for (let i = 0; i < 6 && out.length < 18; i++) {
      for (const l of cats) { if (l[i]) { out.push(l[i]); if (out.length >= 18) break; } }
    }
    // then top up from the real pool so the board is always full, not sparse
    if (out.length < 15) {
      for (const m of parsed) { if (!out.includes(m)) { out.push(m); if (out.length >= 16) break; } }
    }
    if (out.length < 6) throw new Error("too few markets");
    cache = { at: Date.now(), data: out };
    return NextResponse.json({ markets: out });
  } catch {
    return NextResponse.json({ markets: cache?.data || FIXTURE, fallback: true });
  }
}
