"use client";
import { useEffect, useState } from "react";

export default function OverrideBanner() {
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const tick = async () => {
      try {
        const r = await fetch("/api/override");
        const d = await r.json();
        if (d.active) {
          setActive(true);
          setSecondsLeft(d.secondsLeft);
        } else {
          setActive(false);
        }
      } catch {}
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => clearInterval(i);
  }, []);

  if (!active) return null;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <div className="siren text-white font-display tracking-[6px] py-3 px-6 text-center text-lg flex items-center justify-center gap-6">
      <span>OVERRIDE WINDOW LIVE</span>
      <span aria-hidden="true" style={{ display: "inline-block", width: 6, height: 6, background: "currentColor", borderRadius: "50%" }} />
      <span>SIGNALS COUNT 5×</span>
      <span aria-hidden="true" style={{ display: "inline-block", width: 6, height: 6, background: "currentColor", borderRadius: "50%" }} />
      <span>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")} REMAINING</span>
    </div>
  );
}
