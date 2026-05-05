"use client";
import { useEffect, useState } from "react";

export default function StreakStrip() {
  const [stats, setStats] = useState<any>(null);
  const [activeNow, setActiveNow] = useState(0);
  const [windowEnds, setWindowEnds] = useState<Date | null>(null);

  useEffect(() => {
    const wallet = typeof window !== "undefined" ? localStorage.getItem("freelons_wallet") : null;
    const tick = async () => {
      // Active signals in the last 60 min
      const r = await fetch("/api/wall");
      const d = await r.json();
      const now = Date.now();
      const last60 = (d.signals || []).filter((s: any) => now - s.postedAt < 60 * 60 * 1000);
      setActiveNow(last60.length);

      if (wallet) {
        const r2 = await fetch(`/api/profile?wallet=${encodeURIComponent(wallet)}`);
        const d2 = await r2.json();
        setStats(d2.stats);
      }

      // 24h window ends at top of next UTC day
      const next = new Date();
      next.setUTCHours(24, 0, 0, 0);
      setWindowEnds(next);
    };
    tick();
    const i = setInterval(tick, 8000);
    return () => clearInterval(i);
  }, []);

  const remaining = windowEnds ? Math.max(0, Math.floor((windowEnds.getTime() - Date.now()) / 1000)) : 0;
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);

  return (
    <div className="streak-strip border-b border-purple/30 bg-[#1a1611]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-manila text-[11px] md:text-xs tracking-[2px] uppercase font-mono">
        <div className="flex items-center gap-4">
          <span className="pulse-dot" />
          <span><span className="opacity-70">SIGNALS LAST 60 MIN:</span> <span className="text-purple font-bold">{activeNow}</span></span>
          {stats && (
            <>
              <span className="opacity-30">·</span>
              <span><span className="opacity-70">STREAK:</span> <span className="text-purple font-bold">{stats.streak}d</span></span>
              <span className="opacity-30 hidden md:inline">·</span>
              <span className="hidden md:inline"><span className="opacity-70">RANK:</span> <span className="text-purple font-bold">#{stats.rank}</span></span>
            </>
          )}
        </div>
        <div className="text-right">
          <span className="opacity-70">WINDOW CLOSES</span>{" "}
          <span className="text-purple font-bold">
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
