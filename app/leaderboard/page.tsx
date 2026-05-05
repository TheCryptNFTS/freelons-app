"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleArrow, ScribbleUnderline, ScribbleCircle } from "@/components/Scribble";

export default function LeaderboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    setMe(localStorage.getItem("freelons_wallet"));
    const tick = async () => {
      const r = await fetch("/api/leaderboard");
      const d = await r.json();
      setData(d.leaderboard || []);
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => clearInterval(i);
  }, []);

  const myIdx = me ? data.findIndex(h => h.wallet === me) : -1;
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      <main className="relative px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">

          {/* MASSIVE TITLE — left, with serif counterpoint */}
          <div className="grid md:grid-cols-12 gap-10 items-end mb-16 md:mb-24">
            <div className="md:col-span-7 md:pl-8">
              <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
                FILE FHD-1986-L · LIVE · UPDATING
              </div>
              <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>
                RANKS.
              </h1>
              <h2 className="display-h-serif" style={{ color: "var(--purple-glow)", marginLeft: "0.4em", marginTop: "-0.2em" }}>
                strongest signals.
              </h2>
              <ScribbleUnderline width={300} color="#c9a02d" className="ml-12 mt-3" />
            </div>
            <div className="md:col-span-5 md:text-right">
              <p className="handwritten text-2xl max-w-sm md:ml-auto leading-snug" style={{ color: "var(--manila)", opacity: 0.85 }}>
                "the ones still posting<br />after midnight"
              </p>
              <span className="signature mt-4 inline-block" style={{ color: "var(--manila)", borderColor: "var(--manila)" }}>— admin</span>
            </div>
          </div>

          {/* TOP 3 — gigantic, on dark not in card */}
          <div className="grid md:grid-cols-3 gap-10 mb-20 relative">
            {top3.map((h, i) => {
              const accent = i === 0 ? "var(--mustard)" : i === 1 ? "#bdbdbd" : "var(--salmon-pale)";
              const tilt = i === 0 ? "-rotate-1" : i === 1 ? "rotate-1" : "-rotate-2";
              return (
                <div key={h.wallet} className={`relative ${tilt} ${i === 1 ? "md:mt-12" : ""}`}>
                  {i === 0 && (
                    <ScribbleCircle size={180} color="#c9a02d" className="absolute -top-6 -left-6 hidden md:block" />
                  )}
                  <div className="relative z-10 pt-2 pl-2">
                    <div className="display-massive leading-none" style={{ color: accent, fontSize: "clamp(160px, 22vw, 280px)" }}>
                      {String(i + 1).padStart(2, "0")}.
                    </div>
                    <div className="-mt-4">
                      <div className="display-h-serif" style={{ color: "var(--manila)", fontSize: "clamp(28px, 3.5vw, 44px)" }}>
                        {h.wallet}
                      </div>
                      <div className="typewriter text-xs tracking-[2px] mt-2 opacity-70" style={{ color: "var(--manila)" }}>
                        {h.totalScore} SIGNALS · {h.streak}d STREAK
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <MarqueeStrip />

          {/* REST OF LEADERBOARD as paper roll */}
          <div className="paper tilt-2 mt-20 relative">
            <div className="file-tab right">RANKS · 04 — 100</div>
            <div className="absolute top-10 left-10 z-10">
              <div className="stamp" data-rot={2} data-text="LIVE">LIVE</div>
            </div>

            <div className="px-8 md:px-14 py-12">
              <div className="text-[10px] tracking-[3px] opacity-70 mb-4">
                FREELONS · HEX SIGNAL DIVISION · POSITIONS 04 ONWARDS
              </div>
              <div className="border-b border-ink/40" />

              <table className="w-full mt-6 text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[4px] uppercase opacity-60">
                    <th className="text-left py-2">RANK</th>
                    <th className="text-left py-2">HOLDER</th>
                    <th className="text-left py-2">SIGNALS</th>
                    <th className="text-left py-2">STREAK</th>
                    <th className="text-left py-2 hidden md:table-cell">TOKENS</th>
                    <th className="text-left py-2">LAST</th>
                  </tr>
                </thead>
                <tbody className="typewriter">
                  {rest.map((h, i) => {
                    const realIdx = i + 3;
                    const isMe = me && h.wallet === me;
                    const distAbove = data[realIdx - 1].totalScore - h.totalScore;
                    return (
                      <tr key={h.wallet} className={`lb-row ${isMe ? "is-me" : ""}`}>
                        <td className="py-3 pr-4 align-top">
                          <span className="display-h-serif" style={{ fontSize: "26px" }}>{String(realIdx + 1).padStart(2, "0")}</span>
                        </td>
                        <td className="py-3 pr-4 align-top tracking-[1px]">
                          <span className={isMe ? "font-bold" : ""}>{h.wallet}</span>
                          {isMe && <span className="ml-2 label-purple text-[9px]">YOU</span>}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span className="display-h-sm" style={{ fontSize: "22px" }}>{h.totalScore}</span>
                          {distAbove > 0 && <span className="ml-2 text-[10px] opacity-60">−{distAbove}</span>}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          {h.streak > 0 ? <span className="label-purple text-[10px]">{h.streak}d</span> : <span className="opacity-40">—</span>}
                        </td>
                        <td className="py-3 pr-4 text-xs opacity-80 align-top hidden md:table-cell">
                          {h.tokenIds.slice(0, 3).map((t: number) => `#${t}`).join(" · ")}
                        </td>
                        <td className="py-3 text-xs opacity-70 align-top">
                          {timeAgo(h.lastSignalAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {data.length === 0 && <p className="opacity-60 mt-6 typewriter">No signals yet. Be the first.</p>}
            </div>

            <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
              <div className="display-h-sm" style={{ fontSize: "28px", letterSpacing: "5px" }}>
                404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span>
              </div>
              <div className="hidden md:block opacity-70 typewriter text-xs">END OF ROLL · PG 02/02</div>
            </div>
          </div>

          {/* YOUR CLOSEST TARGET — overlapping */}
          {me && myIdx >= 0 && data[myIdx - 1] && (
            <div className="relative max-w-3xl mx-auto mt-16 paper tilt-3 -mb-12">
              <div className="absolute -top-4 -right-4 hidden md:block">
                <ScribbleArrow size={100} color="#b8523a" className="rotate-[200deg]" />
              </div>
              <div className="px-10 py-10 relative z-10">
                <div className="typewriter text-[10px] tracking-[5px] opacity-70 mb-2">YOUR CLOSEST TARGET</div>
                <div className="display-h-serif" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "var(--purple)" }}>
                  {data[myIdx - 1].wallet}
                </div>
                <p className="handwritten text-xl mt-4">
                  +{data[myIdx - 1].totalScore - data[myIdx].totalScore} signals ahead. <em>overtake them.</em>
                </p>
                <a href="/signal" className="btn-primary mt-6 inline-block">SEND SIGNAL ▸</a>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function timeAgo(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
