"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleUnderline, Signature } from "@/components/Scribble";

export default function WallPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const lastIdRef = useRef<string>("");

  useEffect(() => {
    const es = new EventSource("/api/wall/stream");
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try { setSignals(JSON.parse(e.data).signals || []); } catch {}
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  const newest = signals[0]?.id;
  const isFresh = newest && newest !== lastIdRef.current;
  if (isFresh) lastIdRef.current = newest;

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      <main className="relative px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">

          {/* HUGE TITLE + LIVE STATUS — broken layout */}
          <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
            <div className="md:col-span-7 md:pl-8">
              <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
                FILE FHD-1986-W · LIVE TRANSMISSIONS
              </div>
              <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>
                THE WALL.
              </h1>
              <ScribbleUnderline width={300} color="#c9a02d" className="ml-12" />
            </div>
            <div className="md:col-span-5">
              <div className="md:text-right">
                <div className={`inline-flex items-center gap-3 ${connected ? "" : "opacity-50"}`}>
                  <span className="pulse-dot" />
                  <span className="display-h-serif" style={{ color: connected ? "var(--purple-glow)" : "var(--salmon)", fontSize: "clamp(40px, 5vw, 64px)" }}>
                    {connected ? "live." : "offline."}
                  </span>
                </div>
                <p className="handwritten text-lg mt-2" style={{ color: "var(--manila)" }}>
                  {signals.length} transmissions <em>and counting.</em>
                </p>
              </div>
            </div>
          </div>

          {/* THE FEED — paper roll */}
          <div className="paper tilt-1 relative">
            <div className="file-tab left">LIVE FEED · ROLL</div>
            <div className="absolute top-10 right-10 z-10">
              <div className={`stamp ${connected ? "" : "salmon"}`} data-rot={4} data-text={connected ? "LIVE" : "OFFLINE"}>
                {connected ? "LIVE" : "OFFLINE"}
              </div>
            </div>

            <div className="px-8 md:px-14 py-12 relative z-10">
              <div className="text-[10px] tracking-[3px] opacity-70 flex justify-between mb-4">
                <span>FREELONS — HEX SIGNAL DIVISION · ALL TRANSMISSIONS</span>
                <span>STREAM · {signals.length}</span>
              </div>
              <div className="border-b border-ink/40" />

              <div className="teletype mt-6">
                <div className="row" style={{ background: "var(--ink)", color: "var(--manila)" }}>
                  <span className="text-[10px] tracking-[4px] uppercase opacity-70 w-20">TIME</span>
                  <span className="text-[10px] tracking-[4px] uppercase opacity-70 flex-1">HOLDER</span>
                  <span className="text-[10px] tracking-[4px] uppercase opacity-70 w-20">TOKEN</span>
                  <span className="text-[10px] tracking-[4px] uppercase opacity-70">STATUS</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {signals.map((s, i) => (
                    <div key={s.id} className={`row typewriter ${i === 0 && isFresh ? "fresh" : ""}`}>
                      <span className="text-xs opacity-70 w-20">
                        {new Date(s.postedAt).toLocaleTimeString([], { hour12: false })}
                      </span>
                      <span className="font-bold tracking-[1px] flex-1 truncate">{s.wallet}</span>
                      <span className="opacity-80 text-xs w-20">#{s.tokenId}</span>
                      <span className="flex gap-2 items-center">
                        {s.multiplier > 1 && <span className="label-salmon">{s.multiplier}×</span>}
                        <span className="label-purple">SIGNAL</span>
                      </span>
                    </div>
                  ))}
                  {signals.length === 0 && (
                    <div className="row opacity-60"><span className="typewriter">awaiting transmissions...</span></div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end">
                <Signature name="Operator on duty" />
                <span className="typewriter text-[10px] tracking-[3px] opacity-70">END OF ROLL · CONTINUOUS</span>
              </div>
            </div>

            <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
              <div className="display-h-sm" style={{ fontSize: "28px", letterSpacing: "5px" }}>
                404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span>
              </div>
              <div className="hidden md:block opacity-70 typewriter text-xs">STREAM · 24/7</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
