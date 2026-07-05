import { oracle, brier, settlePot, stakeWon, ratingGrade, type Stance } from "../lib/oracle";

let fail = 0;
const ok = (n: string, c: boolean, extra?: any) => { console.log((c ? "PASS" : "FAIL") + " — " + n + (c ? "" : "  " + JSON.stringify(extra))); if (!c) fail++; };
const near = (a: number, b: number, e = 0.001) => Math.abs(a - b) < e;

// pure fns
ok("brier perfect YES", near(brier(1, true), 0));
ok("brier worst", near(brier(0, true), 1));
ok("brier 0.6 vs YES = 0.16", near(brier(0.6, true), 0.16));
ok("stakeWon FOLLOW when edge right", stakeWon("FOLLOW", "YES", "YES") === true);
ok("stakeWon FADE when edge right", stakeWon("FADE", "YES", "YES") === false);

// pot settlement (pari-mutuel): FOLLOW pool 150 wins, FADE pool 100 distributed
const ss: Stance[] = [
  { id: "A", duelId: "d", wallet: "a", tokenId: 1, stake: "FOLLOW", ownProbYes: 0.7, hex: 100, placedAt: 0, settled: false },
  { id: "B", duelId: "d", wallet: "b", tokenId: 2, stake: "FADE", ownProbYes: 0.3, hex: 100, placedAt: 0, settled: false },
  { id: "C", duelId: "d", wallet: "c", tokenId: 3, stake: "FOLLOW", ownProbYes: 0.55, hex: 50, placedAt: 0, settled: false },
];
const pay = settlePot(ss, "YES", "YES");
ok("A payout 100 + 66 = 166", pay.get("A") === 166, pay.get("A"));
ok("C payout 50 + 33 = 83", pay.get("C") === 83, pay.get("C"));
ok("B (FADE, lost) payout 0", pay.get("B") === 0);
ok("winners+stake conserves the two pools (166+83 = 150+100 -1 floor)", (pay.get("A")! + pay.get("C")!) <= 250 && (pay.get("A")! + pay.get("C")!) >= 248);

// end-to-end through the store
const duel = oracle.publishDuel({ marketId: "fixture-btc-week", marketTitle: "BTC>70k?", domain: "crypto", edgeProbYes: 0.6, lockInMinutes: 60 });
ok("edgeSide YES for 0.6", duel.edgeSide === "YES");
ok("sealHash committed", /^OL[0-9A-F]{10}$/.test(duel.sealHash));
const balBefore = oracle.hexBalance("0xA");
const r1 = oracle.placeStance({ duelId: duel.id, wallet: "0xA", tokenId: 1, stake: "FOLLOW", ownProbYes: 0.7, hex: 100 });
ok("stance A placed", r1.ok === true);
ok("HEX debited on stake", oracle.hexBalance("0xA") === balBefore - 100);
oracle.placeStance({ duelId: duel.id, wallet: "0xB", tokenId: 2, stake: "FADE", ownProbYes: 0.3, hex: 100 });
oracle.placeStance({ duelId: duel.id, wallet: "0xC", tokenId: 3, stake: "FOLLOW", ownProbYes: 0.55, hex: 50 });
ok("double-stake same wallet rejected", oracle.placeStance({ duelId: duel.id, wallet: "0xA", tokenId: 1, stake: "FADE", ownProbYes: 0.5, hex: 10 }).ok === false);
ok("below-min stake rejected", oracle.placeStance({ duelId: duel.id, wallet: "0xZ", tokenId: 9, stake: "FOLLOW", ownProbYes: 0.5, hex: 1 }).ok === false);

const res = oracle.resolveDuel(duel.id, "YES", "test");
ok("resolve settled 3", res.ok && (res as any).settled === 3);
// HEX is NEVER minted — only the zero-sum pot moves it. A: won pot (100+66=166).
ok("A balance = 1000 -100 +166 = 1066 (no mint)", oracle.hexBalance("0xA") === 1066, oracle.hexBalance("0xA"));
ok("B balance = 1000 -100 +0 = 900", oracle.hexBalance("0xB") === 900, oracle.hexBalance("0xB"));
ok("C balance = 1000 -50 +83 = 1033", oracle.hexBalance("0xC") === 1033, oracle.hexBalance("0xC"));
ok("no HEX minted (3 wallets sum <= 3000 started)", oracle.hexBalance("0xA") + oracle.hexBalance("0xB") + oracle.hexBalance("0xC") <= 3000);
const ra = oracle.ratingFor(1);
ok("token1 rating recorded 1 resolved", ra?.resolved === 1);
ok("token1 beat edge is a STAT not a mint", (ra as any)?.beatEdgeCount === 1);
// void refunds
const d2 = oracle.publishDuel({ marketId: "fixture-eth-3800", marketTitle: "x", domain: "crypto", edgeProbYes: 0.5, lockInMinutes: 60 });
oracle.placeStance({ duelId: d2.id, wallet: "0xV", tokenId: 5, stake: "FOLLOW", ownProbYes: 0.5, hex: 100 });
const vbal = oracle.hexBalance("0xV");
oracle.voidDuel(d2.id);
ok("void refunds the stake", oracle.hexBalance("0xV") === vbal + 100, oracle.hexBalance("0xV"));
ok("resolve is idempotent", (oracle.resolveDuel(duel.id, "YES", "test") as any).settled === 0);

console.log(fail === 0 ? "\nORACLE ENGINE OK" : ("\n" + fail + " FAIL"));
process.exit(fail ? 1 : 0);
