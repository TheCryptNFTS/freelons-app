"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import { useAccount } from "wagmi";

type Duel = {
  id: string; marketTitle: string; domain: string;
  edgeProbYes: number; edgeSide: "YES" | "NO"; edgeConfidence: number;
  sealHash: string; status: "open" | "locked" | "resolved" | "void";
  lockTs: number; lockInMs: number; outcome: "YES" | "NO" | null;
  edgeBrier: number | null; resolvedAt: number | null;
};
type Today = {
  duel: Duel | null; pot: { follow: number; fade: number } | null;
  participants: number; wallet: string | null; hexBalance: number | null; yourStance: any;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function OraclePage() {
  const { address } = useAccount();
  const [session, setSession] = useState<{ wallet: string } | null>(null);
  const [demoWallet, setDemoWallet] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [data, setData] = useState<Today | null>(null);
  const [stake, setStake] = useState<"FOLLOW" | "FADE">("FOLLOW");
  const [ownProb, setOwnProb] = useState(60);
  const [hex, setHex] = useState(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const pollRef = useRef<any>(null);

  const wallet = session?.wallet || demoWallet;

  async function refresh() {
    const r = await fetch("/api/oracle/today", { cache: "no-store" });
    setData(await r.json());
  }
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setSession(d.session)).catch(() => {});
    refresh();
    pollRef.current = setInterval(refresh, 5000);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(pollRef.current); clearInterval(t); };
  }, []);

  const duel = data?.duel;
  const pot = data?.pot;
  const potTotal = (pot?.follow || 0) + (pot?.fade || 0);
  const followPctBar = potTotal ? (pot!.follow / potTotal) * 100 : 50;

  const lockLeft = useMemo(() => {
    if (!duel) return 0;
    return Math.max(0, duel.lockTs - now);
  }, [duel, now]);
  const countdown = fmtDur(lockLeft);
  const isOpen = duel?.status === "open" && lockLeft > 0;

  async function claimDaily() {
    if (!wallet) return;
    await fetch("/api/oracle/faucet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet }) });
    refresh();
  }

  async function submit() {
    if (!duel || !wallet || !tokenId) { setErr("connect / enter a token id first"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/oracle/stance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duelId: duel.id, tokenId, stake, ownProbYes: ownProb / 100, hex, wallet }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(
          d.error === "not_owner" ? `you don't own #${tokenId} (owner ${d.owner?.slice(0, 10)}…)` :
          d.error === "insufficient_hex" ? "not enough HEX — claim your daily allowance" :
          d.error === "already_staked" ? "you've already locked a call on this duel" :
          d.error === "duel_locked" ? "this duel has locked" :
          d.error === "bad_stake" ? `stake must be ${d.detail?.min}–${d.detail?.max} HEX` :
          d.error === "auth_required" ? "connect + sign in with your wallet (top right)" :
          d.error || "error"
        );
        return;
      }
      refresh();
    } finally { setBusy(false); }
  }

  const shareResolved = () => {
    if (!duel || !data?.yourStance) return "#";
    const won = data.yourStance.payout > 0;
    const beat = data.yourStance.beatEdge;
    const text = `THE ORACLE LEDGER · ${duel.sealHash}\n\n${beat ? "I out-forecast the AI." : won ? "I beat the pot." : "The AI got this one."}\nMarket: ${duel.marketTitle}\nEdge called ${pct(duel.edgeProbYes)} · outcome ${duel.outcome}\n\nfreeloncity.com/oracle · HEX points, not money #FREELONS`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <Nav />
      <main className="relative px-4 py-14 md:py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>
              THE ORACLE LEDGER · DAILY DUEL · BEAT THE AI
            </div>
            <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(64px, 13vw, 170px)" }}>OUT-CALL</h1>
            <h2 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.18em" }}>the machine.</h2>
            <p className="typewriter text-[11px] tracking-[2px] mt-4 opacity-70">
              HEX is points, not money · outcomes settle on public markets · you keep your own wallet
            </p>
          </div>

          {!duel ? (
            <div className="paper max-w-2xl mx-auto px-10 py-14 text-center">
              <div className="typewriter text-[10px] tracking-[3px] opacity-70">NO OPEN DUEL</div>
              <h3 className="display-h-serif mt-3" style={{ fontSize: "clamp(36px,6vw,64px)" }}>The desk is quiet.</h3>
              <p className="handwritten text-lg mt-4 opacity-80">Edge hasn't sealed today's call yet. Check back.</p>
            </div>
          ) : (
            <div className="paper tilt-1 relative">
              <div className="file-tab left">DUEL · {duel.id.slice(0, 6).toUpperCase()}</div>
              <div className="absolute top-8 right-8 z-10">
                <div className={`stamp ${duel.status === "resolved" ? "green" : "mustard"}`} data-rot={3} data-text={duel.status.toUpperCase()}>{duel.status.toUpperCase()}</div>
              </div>

              <div className="px-8 md:px-14 py-12">
                <div className="text-[10px] tracking-[3px] flex justify-between opacity-70">
                  <span>EDGE — OBJECTIVE MARKET · {duel.domain.toUpperCase()}</span>
                  <span>SEAL <b>{duel.sealHash}</b></span>
                </div>
                <div className="border-b border-ink/40 mt-2" />

                <h3 className="display-h-serif mt-7" style={{ fontSize: "clamp(28px, 4.5vw, 52px)" }}>{duel.marketTitle}</h3>

                {/* Edge's sealed call */}
                <div className="mt-8 grid md:grid-cols-2 gap-6 items-end">
                  <div>
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70">EDGE'S SEALED CALL</div>
                    <div className="display-massive leading-none" style={{ color: "var(--purple)", fontSize: "clamp(64px,10vw,120px)" }}>
                      {pct(duel.edgeProbYes)}
                    </div>
                    <div className="typewriter text-sm mt-1">
                      YES · Edge favors <b>{duel.edgeSide}</b> · conf {pct(duel.edgeConfidence)}
                      {duel.edgeBrier != null && <> · Brier <b>{duel.edgeBrier.toFixed(3)}</b></>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70">{isOpen ? "LOCKS IN" : duel.status === "resolved" ? "RESOLVED" : "LOCKED"}</div>
                    <div className="display-h-sm" style={{ fontSize: "44px", color: isOpen ? "var(--ink)" : "var(--salmon)" }}>{duel.status === "resolved" ? duel.outcome : countdown}</div>
                    <div className="typewriter text-[11px] opacity-70">{data?.participants || 0} citizens in · {potTotal} HEX pot</div>
                  </div>
                </div>

                {/* Pot split bar */}
                <div className="mt-6">
                  <div className="flex justify-between typewriter text-[10px] tracking-[2px] opacity-70 mb-1">
                    <span>FOLLOW {pot?.follow || 0}</span><span>FADE {pot?.fade || 0}</span>
                  </div>
                  <div className="h-3 w-full border-3 border-ink overflow-hidden flex">
                    <div style={{ width: `${followPctBar}%`, background: "var(--purple)" }} />
                    <div style={{ width: `${100 - followPctBar}%`, background: "var(--salmon)" }} />
                  </div>
                </div>

                {/* Resolved result */}
                {duel.status === "resolved" && data?.yourStance ? (
                  <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-6">
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70">YOUR RECEIPT · EDGE'S CALL WAS SEALED &amp; SHOWN BEFORE LOCK ({duel.sealHash})</div>
                    <div className="grid md:grid-cols-3 gap-4 mt-3 typewriter text-sm">
                      <Stat label="OUTCOME" value={duel.outcome || "—"} />
                      <Stat label="YOUR CALL" value={pct(data.yourStance.ownProbYes)} />
                      <Stat label="YOUR BRIER" value={(data.yourStance.brier ?? 0).toFixed(3)} sub={data.yourStance.beatEdge ? "BEAT EDGE ✓" : `vs edge ${(duel.edgeBrier ?? 0).toFixed(3)}`} />
                      <Stat label="STAKE" value={`${data.yourStance.hex} HEX`} />
                      <Stat label="PAYOUT" value={`${data.yourStance.payout ?? 0} HEX`} sub={data.yourStance.payout > 0 ? "WON POT" : "lost pot"} />
                      <Stat label="HEX BALANCE" value={`${data.hexBalance ?? 0}`} />
                    </div>
                    <a href={shareResolved()} target="_blank" rel="noreferrer" className="btn-primary inline-block mt-6">SHARE THE RECEIPT ▸</a>
                  </div>
                ) : data?.yourStance ? (
                  <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-6">
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70">YOUR CALL IS LOCKED</div>
                    <p className="handwritten text-xl mt-2">
                      <b>{data.yourStance.stake}</b> · you say <b>{pct(data.yourStance.ownProbYes)}</b> YES · {data.yourStance.hex} HEX · citizen #{data.yourStance.tokenId}
                    </p>
                    <p className="typewriter text-[11px] opacity-70 mt-2">come back when it resolves for your Brier vs Edge + payout.</p>
                  </div>
                ) : isOpen ? (
                  /* Forecast controls */
                  <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-3">
                      <button onClick={() => setStake("FOLLOW")} className={stake === "FOLLOW" ? "btn-primary" : "btn-ghost"}>
                        FOLLOW EDGE ({duel.edgeSide} wins)
                      </button>
                      <button onClick={() => setStake("FADE")} className={stake === "FADE" ? "btn-primary" : "btn-ghost"}>
                        FADE EDGE ({duel.edgeSide} loses)
                      </button>
                    </div>

                    <div>
                      <label className="typewriter text-[10px] tracking-[3px] opacity-80 block mb-1">YOUR PROBABILITY OF YES — <b>{ownProb}%</b> (scored on calibration)</label>
                      <input type="range" min={1} max={99} value={ownProb} onChange={(e) => setOwnProb(Number(e.target.value))} className="w-full" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="typewriter text-[10px] tracking-[3px] opacity-80 block mb-1">HEX STAKE</label>
                        <input value={hex} onChange={(e) => setHex(Number(e.target.value.replace(/\D/g, "")) || 0)} className="w-full px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="typewriter text-[10px] tracking-[3px] opacity-80 block mb-1">CITIZEN TOKEN ID</label>
                        <input value={tokenId} onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))} placeholder="333" className="w-full px-3 py-2 text-sm" />
                      </div>
                      <div className="text-right">
                        <div className="typewriter text-[10px] tracking-[3px] opacity-70">HEX BALANCE</div>
                        <div className="display-h-sm" style={{ fontSize: "28px" }}>{data?.hexBalance ?? "—"}</div>
                        <button onClick={claimDaily} className="typewriter text-[10px] underline opacity-70">claim daily HEX</button>
                      </div>
                    </div>

                    {!session && (
                      <div className="paper p-4">
                        <p className="typewriter text-[10px] tracking-[3px] uppercase opacity-70 mb-1">DEMO — ENS HANDLE (or connect a wallet, top right)</p>
                        <input value={demoWallet} onChange={(e) => setDemoWallet(e.target.value.toLowerCase())} placeholder="vitalik.eth" className="w-full px-3 py-2 text-sm" />
                      </div>
                    )}

                    <button disabled={busy || !wallet || !tokenId} onClick={submit} className="btn-primary w-full">
                      {busy ? "LOCKING…" : "LOCK MY CALL ▸"}
                    </button>
                    {err && <p className="typewriter text-sm" style={{ color: "var(--salmon)" }}>{err}</p>}
                  </div>
                ) : duel.status === "resolved" ? (
                  <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-6">
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70">RESULT · YOU DIDN'T PLAY THIS ONE</div>
                    <div className="grid md:grid-cols-3 gap-4 mt-3 typewriter text-sm">
                      <Stat label="OUTCOME" value={duel.outcome || "—"} />
                      <Stat label="EDGE CALLED" value={pct(duel.edgeProbYes)} sub={`favored ${duel.edgeSide}`} />
                      <Stat label="EDGE BRIER" value={(duel.edgeBrier ?? 0).toFixed(3)} sub={(duel.edgeBrier ?? 1) < 0.25 ? "decent call" : "poor call"} />
                    </div>
                    <p className="handwritten text-lg mt-4 opacity-80">next duel drops soon — lock a call and take the machine on.</p>
                  </div>
                ) : (
                  <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-6">
                    <p className="handwritten text-xl opacity-80">Locked — awaiting the real market outcome.</p>
                  </div>
                )}
              </div>

              <div className="bg-ink text-manila px-8 py-3 flex items-center justify-between">
                <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>THE ORACLE <span style={{ color: "var(--purple-glow)" }}>LEDGER</span></div>
                <a href="/oracle/leaderboard" className="typewriter text-[10px] underline opacity-80">CALIBRATION RANKS ▸</a>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-b border-dashed border-ink/30 pb-2">
      <div className="opacity-60 text-[10px] tracking-[2px]">{label}</div>
      <div className="font-bold display-h-sm" style={{ fontSize: "26px", color: "var(--purple)" }}>{value}</div>
      {sub && <div className="text-[10px] opacity-70">{sub}</div>}
    </div>
  );
}

function fmtDur(ms: number): string {
  if (ms <= 0) return "LOCKED";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}
