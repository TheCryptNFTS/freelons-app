"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Row = { tokenId: number; owner: string; resolved: number; avgBrier: number; edgeAvgBrier: number; beatEdgeCount: number; grade: string };
type CvM = { duels: number; crowdAvgBrier: number; edgeAvgBrier: number; crowdWins: boolean } | null;

export default function OracleLeaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cvm, setCvm] = useState<CvM>(null);

  useEffect(() => {
    fetch("/api/oracle/leaderboard", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setRows(d.leaderboard || []); setCvm(d.crowdVsMachine || null);
    }).catch(() => {});
  }, []);

  return (
    <>
      <Nav />
      <main className="relative px-4 py-14 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>THE ORACLE LEDGER · CALIBRATION RANKS</div>
            <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(56px,11vw,150px)" }}>THE ANALYSTS</h1>
            <p className="typewriter text-[11px] tracking-[2px] mt-3 opacity-70">ranked by lowest average Brier — skill, not luck (5+ resolved calls)</p>
            <p className="typewriter text-[10px] tracking-[2px] mt-1 opacity-60">HEX is points, not money · outcomes settle on public markets</p>
          </div>

          {cvm && (
            <div className="paper px-8 py-6 mb-8 flex items-center justify-between">
              <div>
                <div className="typewriter text-[10px] tracking-[3px] opacity-70">CROWD vs MACHINE · {cvm.duels} duels</div>
                <div className="display-h-serif mt-1" style={{ fontSize: "clamp(28px,5vw,44px)" }}>
                  {cvm.crowdWins ? "The Citizens lead." : "The Machine leads."}
                </div>
              </div>
              <div className="text-right typewriter text-sm">
                <div>crowd Brier <b>{cvm.crowdAvgBrier.toFixed(3)}</b></div>
                <div>edge Brier <b>{cvm.edgeAvgBrier.toFixed(3)}</b></div>
              </div>
            </div>
          )}

          <div className="paper">
            <div className="file-tab left">RANKS</div>
            <div className="px-6 md:px-10 py-10">
              {rows.length === 0 ? (
                <p className="handwritten text-lg opacity-80 text-center py-6">No ranked citizens yet — 5 resolved calls to qualify.</p>
              ) : (
                <div className="space-y-1">
                  {rows.map((r, i) => (
                    <div key={r.tokenId} className="flex items-center justify-between py-3 border-b border-dashed border-ink/30">
                      <div className="flex items-center gap-4">
                        <span className="display-h-serif" style={{ fontSize: "36px", color: "var(--purple)" }}>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="font-bold">Citizen #{r.tokenId} <span className="typewriter text-[11px] opacity-70">· {r.grade}</span></p>
                          <p className="typewriter text-[11px] opacity-70">{r.owner.slice(0, 10)}… · {r.resolved} calls · beat Edge {r.beatEdgeCount}/{r.resolved}</p>
                        </div>
                      </div>
                      <div className="text-right typewriter text-xs">
                        <div>Brier <b>{r.avgBrier.toFixed(3)}</b></div>
                        <div className="opacity-70">edge {r.edgeAvgBrier.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-ink text-manila px-8 py-3 flex items-center justify-between">
              <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>THE ORACLE <span style={{ color: "var(--purple-glow)" }}>LEDGER</span></div>
              <a href="/oracle" className="typewriter text-[10px] underline opacity-80">◂ TODAY'S DUEL</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
