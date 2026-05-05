"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import MarqueeStrip from "@/components/MarqueeStrip";
import HexBadge from "@/components/HexBadge";
import { ScribbleUnderline, ScribbleArrow, Signature, Redacted } from "@/components/Scribble";

export default function ProfilePage() {
  const [wallet, setWallet] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("freelons_wallet");
    if (stored) { setWallet(stored); lookup(stored); }
  }, []);

  async function lookup(w?: string) {
    const target = (w || wallet).toLowerCase();
    if (!target) return;
    const r = await fetch(`/api/profile?wallet=${encodeURIComponent(target)}`);
    const d = await r.json();
    setStats(d.stats);
    if (d.stats) localStorage.setItem("freelons_wallet", target);
  }

  function shareText() {
    return encodeURIComponent(
      `I HOLD THE SIGNAL.\n\nFreelon Holder.\nNot just watching. Part of the network.\n\n404 HEX NOT FOUND. Bring back the hex on X. #FREELONS`
    );
  }

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      <main className="relative px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* lookup bar — minimal, off-set */}
          {!stats && (
            <div className="grid md:grid-cols-12 gap-10 items-end">
              <div className="md:col-span-7 md:pl-8">
                <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
                  FILE FHD-1986-P · STATUS LOOKUP
                </div>
                <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>
                  STATUS.
                </h1>
                <ScribbleUnderline width={260} color="#c9a02d" className="ml-12 mt-2" />
                <p className="handwritten text-xl mt-8" style={{ color: "var(--manila)" }}>
                  who's still in the network?
                </p>
              </div>
              <div className="md:col-span-5">
                <div className="paper tilt-2 relative">
                  <div className="file-tab right">LOOKUP</div>
                  <div className="px-10 py-10">
                    <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">
                      WALLET / HANDLE
                    </label>
                    <input
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      placeholder="vitalik.eth"
                      className="w-full px-4 py-3 text-sm"
                    />
                    <button onClick={() => lookup()} className="btn-primary mt-4 w-full">LOOKUP ▸</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* I HOLD THE SIGNAL CARD */}
          {stats && (
            <>
              <div className="text-center mb-2">
                <div className="text-mustard typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>
                  HOLDER STATUS · ACTIVE · ON FILE
                </div>
                <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(80px, 16vw, 220px)" }}>
                  I HOLD
                </h1>
                <h1 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.15em" }}>
                  the signal.
                </h1>
              </div>

              <div className="paper tilt-1 max-w-5xl mx-auto relative">
                <div className="file-tab left">{wallet.toUpperCase()}</div>
                <div className="punch-holes"><div /><div /><div /></div>
                <div className="absolute top-12 right-12 z-10">
                  <div className="stamp" data-rot={4} data-text="ACTIVE">ACTIVE</div>
                </div>

                <div className="px-12 md:px-16 py-12 md:py-14 relative z-10">
                  <div className="text-[10px] tracking-[3px] opacity-70 flex justify-between">
                    <span>FREELONS — HEX SIGNAL DIVISION</span>
                    <span>FILE: <b>FHD-1986-H</b></span>
                  </div>
                  <div className="border-b border-ink/40 mt-2" />

                  <div className="grid md:grid-cols-12 gap-8 mt-10">
                    <div className="md:col-span-7">
                      <p><span className="label-bg">FREELON HOLDER</span></p>
                      <p className="mt-2"><span className="label-purple">PART OF THE NETWORK</span></p>

                      {/* RANK MASSIVE */}
                      <div className="mt-10">
                        <div className="text-[10px] tracking-[4px] opacity-70 typewriter">RANK</div>
                        <div className="display-massive leading-none" style={{ color: "var(--purple)", fontSize: "clamp(120px, 22vw, 320px)" }}>
                          #{stats.rank}
                        </div>
                      </div>

                      <ScribbleUnderline width={260} color="#b8523a" className="mt-2" />

                      {/* SIGNALS + STREAK — mismatched sizes */}
                      <div className="mt-12 grid grid-cols-2 gap-6 items-end">
                        <div>
                          <div className="text-[10px] tracking-[4px] opacity-70 typewriter">SIGNALS</div>
                          <div className="display-h" style={{ fontSize: "clamp(64px, 9vw, 120px)", lineHeight: 1 }}>
                            {stats.totalScore}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] tracking-[4px] opacity-70 typewriter">STREAK</div>
                          <div className="display-h-serif" style={{ fontSize: "clamp(48px, 7vw, 92px)", color: "var(--mustard-dark)", lineHeight: 1 }}>
                            {stats.streak}<em>d</em>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10">
                        <div className="text-[10px] tracking-[4px] opacity-70 typewriter">TOKENS HELD</div>
                        <div className="typewriter mt-1 text-base">
                          {stats.tokenIds.slice(0, 8).map((t: number) => `#${t}`).join("  ·  ")}
                        </div>
                      </div>

                      {stats.closest && (
                        <div className="mt-10 border-t-2 border-dashed border-ink/40 pt-6">
                          <div className="text-[10px] tracking-[4px] opacity-70 typewriter">CLOSEST AHEAD</div>
                          <div className="display-h-sm" style={{ fontSize: "32px" }}>
                            {stats.closest.wallet}
                          </div>
                          <p className="handwritten text-base mt-1">
                            +{stats.closest.gap} signals · <em>still climbing</em>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT — hex + quote + signature */}
                    <div className="md:col-span-5 flex flex-col items-center justify-start mt-4 md:mt-0">
                      <HexBadge size={260} variant="purple" />
                      <div className="mt-6 text-center max-w-[260px]">
                        <p className="handwritten text-xl leading-snug">
                          "stronger together. <br />
                          <em>signal over noise.</em>"
                        </p>
                      </div>

                      <div className="mt-12 text-center">
                        <Signature name={wallet} />
                        <div className="text-[10px] tracking-[3px] mt-1 opacity-70 typewriter">SIGNED · ON FILE</div>
                      </div>

                      <div className="mt-6 hidden md:block">
                        <ScribbleArrow size={80} color="#c9a02d" className="rotate-[200deg]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex gap-3 flex-wrap">
                    <a href={`https://twitter.com/intent/tweet?text=${shareText()}`} target="_blank" rel="noreferrer" className="btn-primary">POST TO X ▸</a>
                    <a href="/signal" className="btn-ghost">SEND ANOTHER</a>
                  </div>
                </div>

                <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
                  <div className="display-h-sm" style={{ fontSize: "28px", letterSpacing: "5px" }}>
                    404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span>
                  </div>
                  <div className="hidden md:block opacity-70 typewriter text-xs">HOLDER STATUS · ON FILE</div>
                </div>
              </div>
            </>
          )}

          {wallet && stats === null && (
            <div className="text-center max-w-xl mx-auto">
              <p className="display-h-serif" style={{ color: "var(--manila)", fontSize: "clamp(40px, 6vw, 80px)" }}>
                no record.
              </p>
              <p className="typewriter text-sm opacity-70 mt-2" style={{ color: "var(--manila)" }}>
                this wallet hasn't sent a signal yet.
              </p>
              <a href="/signal" className="btn-primary mt-6 inline-block">SEND YOUR FIRST ▸</a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
