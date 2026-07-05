"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { FreelonsConnectButton } from "@/components/ConnectButton";

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

  const lockLeft = useMemo(() => (duel ? Math.max(0, duel.lockTs - now) : 0), [duel, now]);
  const countdown = fmtDur(lockLeft);
  const isOpen = duel?.status === "open" && lockLeft > 0;
  const urgent = isOpen && lockLeft < 3600_000;

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
    const text = `THE ORACLE LEDGER · ${duel.sealHash}\n\n${beat ? "I out-forecast the AI." : won ? "I beat the pot." : "The AI got this one."}\nMarket: ${duel.marketTitle}\nEdge called ${pct(duel.edgeProbYes)} · outcome ${duel.outcome}\n\nhex.freeloncity.com/oracle · HEX points, not money #FREELONS`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  return (
    <main className="oracle-shell">
      <div className="ora-wrap">
        {/* top bar */}
        <div className="ora-top">
          <a href="/oracle" className="ora-brand">FREELON CITY <b>· ORACLE</b></a>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="/oracle/leaderboard" className="ora-rank">RANKS ▸</a>
            <FreelonsConnectButton />
          </div>
        </div>

        {/* hero */}
        <div className="ora-hero">
          <div className="ora-kicker">Daily Duel · Beat the AI</div>
          <h1 className="ora-title">OUT-CALL<br />THE MACHINE</h1>
          <p className="ora-sub">Edge seals a probability on a real market. <b>You call it.</b> Closest forecast takes the HEX pot — <b>points, not money.</b></p>
        </div>

        {!duel ? (
          <div className="ora-empty">
            <div className="ora-kicker">No open duel</div>
            <h3>The desk is quiet.</h3>
            <p>Edge hasn&apos;t sealed today&apos;s call yet — check back soon.</p>
          </div>
        ) : (
          <div className="ora-card">
            <div className="ora-inner">
              {/* strip */}
              <div className="ora-strip">
                <span>EDGE · OBJECTIVE MARKET · {duel.domain.toUpperCase()}</span>
                <span className="ora-seal"><span className="dot" />SEALED {duel.sealHash}</span>
              </div>
              <div className="ora-rule" />

              {/* question */}
              <div className="ora-q">{duel.marketTitle}</div>

              {/* face-off */}
              <div className="ora-duel">
                <div className="ora-side ora-machine">
                  <div className="lab">◆ The Machine — Edge&apos;s sealed call</div>
                  <div className="ora-bigpct">{pct(duel.edgeProbYes)}</div>
                  <div className="ora-meta">
                    favors <b>{duel.edgeSide}</b> · conf {pct(duel.edgeConfidence)}
                    {duel.edgeBrier != null && <> · Brier <b>{duel.edgeBrier.toFixed(3)}</b></>}
                  </div>
                </div>

                <div className="ora-vs">VS</div>

                <div className="ora-side ora-you">
                  <div className="lab">{isOpen ? "Locks in" : duel.status === "resolved" ? "Outcome" : "Locked"}</div>
                  <div className={`ora-count${urgent ? " urgent" : ""}`}>{duel.status === "resolved" ? (duel.outcome || "—") : countdown}</div>
                  <div className="ora-meta"><b>{data?.participants || 0}</b> citizens · <b>{potTotal}</b> HEX pot</div>
                </div>
              </div>

              {/* pot bar */}
              <div className="ora-pot">
                <div className="row"><span className="f">FOLLOW · {pot?.follow || 0}</span><span className="a">{pot?.fade || 0} · FADE</span></div>
                <div className="ora-bar">
                  <div className="fill-f" style={{ width: `${followPctBar}%` }} />
                  <div className="fill-a" style={{ width: `${100 - followPctBar}%` }} />
                </div>
              </div>

              {/* ---- states ---- */}
              {duel.status === "resolved" && data?.yourStance ? (
                <>
                  <div className="ora-hr" />
                  <div className="ora-lab">Your receipt · Edge&apos;s call was <b>sealed &amp; shown before lock</b> ({duel.sealHash})</div>
                  <div className="ora-stats">
                    <Stat k="OUTCOME" v={duel.outcome || "—"} />
                    <Stat k="YOUR CALL" v={pct(data.yourStance.ownProbYes)} />
                    <Stat k="YOUR BRIER" v={(data.yourStance.brier ?? 0).toFixed(3)} s={data.yourStance.beatEdge ? "BEAT EDGE ✓" : `vs edge ${(duel.edgeBrier ?? 0).toFixed(3)}`} />
                    <Stat k="STAKE" v={`${data.yourStance.hex} HEX`} />
                    <Stat k="PAYOUT" v={`${data.yourStance.payout ?? 0} HEX`} s={data.yourStance.payout > 0 ? "WON POT" : "lost pot"} />
                    <Stat k="HEX BALANCE" v={`${data.hexBalance ?? 0}`} />
                  </div>
                  <a href={shareResolved()} target="_blank" rel="noreferrer" className="ora-lock" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 22, width: "auto" }}>SHARE THE RECEIPT ▸</a>
                </>
              ) : data?.yourStance ? (
                <>
                  <div className="ora-hr" />
                  <div className="ora-lab">Your call is locked</div>
                  <div className="ora-q" style={{ fontSize: "clamp(20px,3vw,30px)" }}>
                    <b style={{ color: data.yourStance.stake === "FOLLOW" ? "var(--o-gold-bright)" : "var(--o-red)" }}>{data.yourStance.stake}</b> · you say {pct(data.yourStance.ownProbYes)} YES · {data.yourStance.hex} HEX · citizen #{data.yourStance.tokenId}
                  </div>
                  <p className="ora-note" style={{ textAlign: "left", padding: "10px 0 0" }}>Come back when it resolves for your Brier vs Edge + payout.</p>
                </>
              ) : isOpen ? (
                <>
                  <div className="ora-hr" />
                  <div className="ora-choices">
                    <button onClick={() => setStake("FOLLOW")} className={`ora-choice${stake === "FOLLOW" ? " on-f" : ""}`}>
                      FOLLOW EDGE<small>bet {duel.edgeSide} wins</small>
                    </button>
                    <button onClick={() => setStake("FADE")} className={`ora-choice${stake === "FADE" ? " on-a" : ""}`}>
                      FADE EDGE<small>bet {duel.edgeSide} loses</small>
                    </button>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <label className="ora-lab">Your probability of YES — <b>{ownProb}%</b> <span style={{ opacity: .6 }}>(scored on calibration)</span></label>
                    <input type="range" min={1} max={99} value={ownProb} onChange={(e) => setOwnProb(Number(e.target.value))} className="ora-range" style={{ ["--val" as any]: `${ownProb}%` }} />
                  </div>

                  <div className="ora-grid3" style={{ marginTop: 22 }}>
                    <div>
                      <label className="ora-lab">HEX Stake</label>
                      <input value={hex} onChange={(e) => setHex(Number(e.target.value.replace(/\D/g, "")) || 0)} className="ora-field" />
                    </div>
                    <div>
                      <label className="ora-lab">Citizen Token ID</label>
                      <input value={tokenId} onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))} placeholder="333" className="ora-field" />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <label className="ora-lab" style={{ textAlign: "right" }}>HEX Balance</label>
                      <div style={{ fontFamily: "'Clash Display'", fontWeight: 700, fontSize: 28, color: "var(--o-gold-bright)" }}>{data?.hexBalance ?? "—"}</div>
                      <button onClick={claimDaily} className="ora-mini">claim daily HEX</button>
                    </div>
                  </div>

                  {!session && (
                    <div style={{ marginTop: 18 }}>
                      <label className="ora-lab">Demo — ENS handle <span style={{ opacity: .6 }}>(or connect a wallet, top right)</span></label>
                      <input value={demoWallet} onChange={(e) => setDemoWallet(e.target.value.toLowerCase())} placeholder="vitalik.eth" className="ora-field" />
                    </div>
                  )}

                  <button disabled={busy || !wallet || !tokenId} onClick={submit} className="ora-lock" style={{ marginTop: 22 }}>
                    {busy ? "LOCKING…" : "LOCK MY CALL ▸"}
                  </button>
                  {err && <p className="ora-err" style={{ marginTop: 12 }}>{err}</p>}
                </>
              ) : duel.status === "resolved" ? (
                <>
                  <div className="ora-hr" />
                  <div className="ora-lab">Result · you didn&apos;t play this one</div>
                  <div className="ora-stats">
                    <Stat k="OUTCOME" v={duel.outcome || "—"} />
                    <Stat k="EDGE CALLED" v={pct(duel.edgeProbYes)} s={`favored ${duel.edgeSide}`} />
                    <Stat k="EDGE BRIER" v={(duel.edgeBrier ?? 0).toFixed(3)} s={(duel.edgeBrier ?? 1) < 0.25 ? "decent call" : "poor call"} />
                  </div>
                  <p className="ora-note" style={{ textAlign: "left", padding: "12px 0 0" }}>Next duel drops soon — lock a call and take the machine on.</p>
                </>
              ) : (
                <>
                  <div className="ora-hr" />
                  <p className="ora-note" style={{ textAlign: "left", padding: 0 }}>Locked — awaiting the real market outcome.</p>
                </>
              )}
            </div>

            <div className="ora-foot">
              <div className="mk">THE ORACLE <b>LEDGER</b></div>
              <a href="/oracle/leaderboard">CALIBRATION RANKS ▸</a>
            </div>
          </div>
        )}

        <p className="ora-note">HEX is points, not money · outcomes settle on public markets · you keep your own wallet</p>
      </div>
    </main>
  );
}

function Stat({ k, v, s }: { k: string; v: string; s?: string }) {
  return (
    <div className="ora-stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {s && <div className="s">{s}</div>}
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
