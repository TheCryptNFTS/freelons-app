"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleUnderline } from "@/components/Scribble";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    setSecret(localStorage.getItem("freelons_admin_secret") || "");
    refresh();
  }, []);

  async function refresh() {
    const r = await fetch("/api/override");
    setStatus(await r.json());
  }

  async function trigger() {
    if (!secret) { setMsg("secret required"); return; }
    localStorage.setItem("freelons_admin_secret", secret);
    setMsg("triggering...");
    const r = await fetch(`/api/override?start=${minutes}&secret=${encodeURIComponent(secret)}`, { method: "POST" });
    const d = await r.json();
    if (r.ok) setMsg(`OVERRIDE LIVE — ${d.secondsLeft}s remaining`);
    else setMsg(`error: ${d.error || "failed"}`);
    refresh();
  }

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      <main className="relative px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
            FILE FHD-1986-A · ADMIN · INTERNAL ONLY
          </div>
          <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>
            ADMIN.
          </h1>
          <ScribbleUnderline width={300} color="#c9a02d" className="ml-12 mt-2" />

          <div className="paper tilt-3 mt-12 relative">
            <div className="file-tab right">OVERRIDE CONTROL</div>
            <div className="px-10 md:px-14 py-12 relative z-10">
              <h2 className="display-h-serif" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>Trigger Override.</h2>
              <p className="typewriter text-sm opacity-70 mt-2">5× signal multiplier for the next N minutes.</p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">ADMIN SECRET</label>
                  <input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="dev-secret-change-me"
                    className="w-full px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">DURATION (MINUTES)</label>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    min={1}
                    max={1440}
                    className="w-full px-4 py-3 text-sm"
                  />
                </div>
                <button onClick={trigger} className="btn-primary">FIRE OVERRIDE ▸</button>

                {msg && <p className="typewriter text-sm mt-3">{msg}</p>}

                {status?.active && (
                  <div className="mt-6 border-2 border-ink p-4" style={{ boxShadow: "4px 4px 0 var(--salmon)" }}>
                    <p className="typewriter text-[10px] tracking-[3px] opacity-70">CURRENTLY LIVE</p>
                    <p className="display-h-sm" style={{ fontSize: "32px", color: "var(--salmon)" }}>
                      {Math.floor(status.secondsLeft / 60)}:{String(status.secondsLeft % 60).padStart(2, "0")} remaining
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-ink text-manila px-8 py-3 flex justify-between">
              <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span></div>
              <span className="opacity-60 typewriter text-[10px]">ADMIN · 01</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
