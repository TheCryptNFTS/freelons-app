"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleUnderline, ArrowUp, FlameMark } from "@/components/Scribble";
import { useAccount } from "wagmi";

type StatusBadge = "RISING" | "SPIKING" | "QUIET";
const STATUS_STYLE: Record<StatusBadge, { color: string; mark: "flame" | "up" | "flat"; label: string }> = {
  SPIKING: { color: "var(--salmon)", mark: "flame", label: "SPIKING" },
  RISING:  { color: "var(--purple-glow)", mark: "up", label: "RISING" },
  QUIET:   { color: "var(--manila-dark)", mark: "flat", label: "QUIET" },
};

export default function CheckPage() {
  const { address } = useAccount();
  const [walletInput, setWalletInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (address) {
      setWalletInput(address);
      run(address);
    } else {
      const stored = localStorage.getItem("freelons_wallet");
      if (stored) {
        setWalletInput(stored);
        run(stored);
      }
    }
  }, [address]);

  async function run(w?: string) {
    const target = (w || walletInput).trim();
    if (!target) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`/api/check?wallet=${encodeURIComponent(target)}`);
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "lookup failed"); return; }
      setData(d);
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      <main className="relative px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          {/* HERO */}
          <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
            <div className="md:col-span-7 md:pl-8">
              <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
                FILE FHD-1986-C · SIGNAL CHECK
              </div>
              <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>
                CHECK
              </h1>
              <h1 className="display-h-serif" style={{ color: "var(--purple-glow)", marginLeft: "0.4em", marginTop: "-0.2em" }}>
                your signal.
              </h1>
              <ScribbleUnderline width={280} color="#c9a02d" className="ml-12 mt-3" />
              <p className="handwritten text-2xl mt-8 max-w-md" style={{ color: "var(--manila)" }}>
                some Freelons are linked. <em>you won't know until you check.</em>
              </p>
            </div>

            <div className="md:col-span-5">
              <div className="paper tilt-2 relative">
                <div className="file-tab right">LOOKUP</div>
                <div className="px-10 py-10">
                  <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">
                    WALLET / ENS
                  </label>
                  <input
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    placeholder="0x... or vitalik.eth"
                    className="w-full px-4 py-3 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && run()}
                  />
                  <button onClick={() => run()} disabled={loading || !walletInput} className="btn-primary mt-4 w-full">
                    {loading ? "READING..." : "CHECK MY SIGNAL ▸"}
                  </button>
                  {err && <p className="typewriter text-sm mt-3" style={{ color: "var(--salmon)" }}>{err}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          {data && (
            <div className="paper tilt-1 relative mt-16">
              <div className="file-tab left">REPORT · {data.wallet.slice(0, 10).toUpperCase()}</div>
              <div className="absolute top-10 right-10 z-10">
                <div className="stamp" data-rot={3} data-text="REPORT">REPORT</div>
              </div>

              <div className="px-10 md:px-14 py-12">
                <div className="text-[10px] tracking-[3px] opacity-70 flex justify-between mb-3">
                  <span>FREELONS — HEX SIGNAL DIVISION</span>
                  <span>FILE: <b>FHD-1986-C</b></span>
                </div>
                <div className="border-b border-ink/40" />

                <h2 className="display-h-serif mt-8" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                  {data.balance > 0 ? `${data.balance} Freelon${data.balance > 1 ? "s" : ""} found.` : "No Freelons found."}
                </h2>

                {data.note && (
                  <p className="typewriter text-xs opacity-70 mt-4 italic">{data.note}</p>
                )}

                {data.tokens?.length > 0 ? (
                  <div className="mt-10 space-y-3">
                    {data.tokens.map((t: any) => (
                      <TokenRow key={t.tokenId} t={t} />
                    ))}
                  </div>
                ) : data.balance > 0 ? (
                  <p className="handwritten text-xl mt-8">
                    You hold {data.balance} but I can't read which IDs without an indexer key. <em>set NEXT_PUBLIC_ALCHEMY_KEY in env.</em>
                  </p>
                ) : (
                  <div className="mt-10">
                    <p className="handwritten text-2xl">no signals tracked here yet.</p>
                    <p className="typewriter text-xs opacity-70 mt-2">
                      Either this wallet doesn't hold a Freelon, or none of its tokens are linked yet. Some Freelons get linked over time.
                    </p>
                    <a href="https://opensea.io/collection/freelons" target="_blank" rel="noreferrer" className="btn-ghost mt-6 inline-block">
                      VIEW COLLECTION ▸
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
                <div className="display-h-sm" style={{ fontSize: "28px", letterSpacing: "5px" }}>
                  404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span>
                </div>
                <span className="hidden md:inline opacity-70 typewriter text-xs">REPORT END</span>
              </div>
            </div>
          )}

          {/* PUBLIC FEED */}
          {!data && (
            <div className="mt-16">
              <PublicFeed />
            </div>
          )}
        </div>
      </main>

      <DisclaimerFooter />
    </>
  );
}

function TokenRow({ t }: { t: any }) {
  if (!t.tracked) {
    return (
      <div className="grid md:grid-cols-12 gap-4 items-center border-b border-dashed border-ink/30 py-4 typewriter">
        <div className="md:col-span-2 display-h-serif text-3xl">#{String(t.tokenId).padStart(4, "0")}</div>
        <div className="md:col-span-7 text-sm opacity-60 italic">no signal linked.</div>
        <div className="md:col-span-3 text-right">
          <span className="label-bg" style={{ background: "var(--manila-dark)" }}>UNLINKED</span>
        </div>
      </div>
    );
  }
  const s = t.signal;
  const style = STATUS_STYLE[s.status as StatusBadge];
  return (
    <div className="grid md:grid-cols-12 gap-4 items-center border-b border-dashed border-ink/30 py-5">
      <div className="md:col-span-2">
        <div className="display-h-serif text-4xl">#{String(t.tokenId).padStart(4, "0")}</div>
        <div className="typewriter text-[10px] opacity-60 tracking-[2px]">{s.sector}</div>
      </div>
      <div className="md:col-span-5">
        <div className="typewriter text-[10px] tracking-[3px] opacity-70 uppercase">TRACKING</div>
        <div className="display-h-sm" style={{ fontSize: "32px", color: "var(--purple)" }}>{s.handle}</div>
      </div>
      <div className="md:col-span-3 typewriter text-xs">
        <div><span className="opacity-60">ACTIVITY:</span> <b>{s.activity}</b></div>
        <div><span className="opacity-60">LAST SPIKE:</span> <b>{s.lastSpikeAgoHours}h</b></div>
      </div>
      <div className="md:col-span-2 text-right">
        <div className="display-h-sm flex items-center justify-end gap-2" style={{ fontSize: "24px", color: style.color, lineHeight: 1 }}>
          <span>{style.label}</span>
          {style.mark === "flame" && <FlameMark size={20} />}
          {style.mark === "up" && <ArrowUp size={18} />}
          {style.mark === "flat" && <span style={{ fontWeight: "bold" }}>—</span>}
        </div>
      </div>
    </div>
  );
}

function PublicFeed() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/signals-feed").then(r => r.json()).then(d => setList(d.signals || []));
    const i = setInterval(() => {
      fetch("/api/signals-feed").then(r => r.json()).then(d => setList(d.signals || []));
    }, 30000);
    return () => clearInterval(i);
  }, []);
  if (!list.length) return null;
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-mustard typewriter text-[11px] tracking-[5px] text-center mb-4" style={{ color: "var(--mustard)" }}>
        — ACTIVE SIGNALS —
      </div>
      <h3 className="display-h-serif text-center" style={{ color: "var(--manila)", fontSize: "clamp(40px, 6vw, 72px)" }}>
        public feed.
      </h3>
      <p className="typewriter text-xs text-center mt-2 opacity-70" style={{ color: "var(--manila)" }}>
        live status. updates every few hours.
      </p>
      <div className="paper tilt-2 mt-10">
        <div className="px-8 py-8 space-y-2">
          {list.map(s => {
            const style = STATUS_STYLE[s.status as StatusBadge];
            return (
              <div key={s.tokenId} className="flex items-center justify-between border-b border-dashed border-ink/30 py-3 typewriter">
                <div className="flex items-center gap-4">
                  <span className="display-h-serif text-2xl">#{String(s.tokenId).padStart(4, "0")}</span>
                  <div>
                    <div className="typewriter text-[10px] tracking-[2px] opacity-60">TRACKING</div>
                    <div className="text-base font-bold">{s.handle}</div>
                  </div>
                </div>
                <span className="display-h-sm inline-flex items-center gap-2" style={{ fontSize: "20px", color: style.color }}>
                  <span>{style.label}</span>
                  {style.mark === "flame" && <FlameMark size={18} />}
                  {style.mark === "up" && <ArrowUp size={16} />}
                  {style.mark === "flat" && <span style={{ fontWeight: "bold" }}>—</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DisclaimerFooter() {
  return (
    <footer className="mt-20 px-6 pb-12">
      <div className="max-w-4xl mx-auto text-center">
        <p className="display-h-sm" style={{ color: "var(--manila)", fontSize: "20px", letterSpacing: "5px" }}>
          WE DON'T TRACK PEOPLE. <span style={{ color: "var(--purple-glow)" }}>WE TRACK SIGNAL.</span>
        </p>
        <p className="typewriter text-[11px] mt-6 opacity-50 max-w-xl mx-auto" style={{ color: "var(--manila)" }}>
          This site references publicly available social data. No affiliation, partnership,
          ownership of identity, or endorsement is implied. Signal status is derived from
          public posting patterns.
        </p>
      </div>
    </footer>
  );
}
