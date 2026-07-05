// Pure-logic unit checks for the Oracle Ledger scoring. The DB-backed store
// (stake/resolve/void/faucet) is verified directly against Postgres via the
// atomic oracle_* functions; this covers the pure math the SQL mirrors.
// Run: npx tsx scripts/oracle-smoke.ts
import { brier, settlePot, stakeWon, ratingGrade, clamp01, type Stance, type Rating } from "../lib/oracle";

let fail = 0;
const ok = (n: string, c: boolean, extra?: any) => { console.log((c ? "PASS" : "FAIL") + " — " + n + (c ? "" : "  " + JSON.stringify(extra))); if (!c) fail++; };
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;

ok("clamp01", clamp01(1.5) === 1 && clamp01(-1) === 0 && clamp01(NaN) === 0.5);
ok("brier perfect", near(brier(1, true), 0));
ok("brier worst", near(brier(0, true), 1));
ok("brier 0.6 vs YES = 0.16", near(brier(0.6, true), 0.16));
ok("extreme guess avg Brier ~0.5 (why it can't farm the ladder)", near((brier(0.999, true) + brier(0.999, false)) / 2, 0.499, 0.01));

ok("stakeWon FOLLOW when edge right", stakeWon("FOLLOW", "YES", "YES"));
ok("stakeWon FADE loses when edge right", !stakeWon("FADE", "YES", "YES"));
ok("stakeWon FADE wins when edge wrong", stakeWon("FADE", "YES", "NO"));

const ss: Stance[] = [
  { id: "A", duelId: "d", wallet: "a", tokenId: 1, stake: "FOLLOW", ownProbYes: 0.7, hex: 150, placedAt: 0, settled: false },
  { id: "B", duelId: "d", wallet: "b", tokenId: 2, stake: "FADE", ownProbYes: 0.3, hex: 100, placedAt: 0, settled: false },
];
const pay = settlePot(ss, "YES", "YES");
ok("winner takes stake + whole losing pool (150+100)", pay.get("A") === 250, pay.get("A"));
ok("loser payout 0", pay.get("B") === 0);
ok("pot conserved (no mint)", (pay.get("A")! + pay.get("B")!) === 250);

// single-sided pot: winner just gets stake back, nothing minted
const solo = settlePot([ss[0]], "YES", "YES");
ok("single-sided: stake back only", solo.get("A") === 150);

const r5: Rating = { tokenId: 1, owner: "a", resolved: 6, sumBrier: 0.6, sumEdgeBrier: 1.2, beatEdgeCount: 5, byDomain: {}, updatedAt: 0 };
ok("grade A+ (avg .10, beats edge)", ratingGrade(r5) === "A+");
ok("under 5 resolved = UNRANKED", ratingGrade({ ...r5, resolved: 3 }) === "UNRANKED");

console.log(fail === 0 ? "\nORACLE SCORING OK" : ("\n" + fail + " FAIL"));
process.exit(fail ? 1 : 0);
