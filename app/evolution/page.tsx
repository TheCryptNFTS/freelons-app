"use client";
import { useEffect, useState, useCallback } from "react";
import Nav from "@/components/Nav";

// The 4 historical reveal forms of FREELON CITY. CIDs verified live 2026-06-03.
const GW = "https://ipfs.io/ipfs/";
type Form = { key: string; label: string; year: string; desc: string; cid: string; pad: boolean };
const FORMS: Form[] = [
  { key: "hex",    label: "PRE-REVEAL",   year: "GENESIS", desc: "Hex Signal — the dormant placeholder",
    cid: "bafybeihfplcm2hottjdoweqmwhzfinpvyxuoa6dqndqngtuupu67qjvy6i", pad: true },
  { key: "report", label: "THE INCIDENT", year: "404",     desc: "404 Hex Not Found — incident report",
    cid: "bafybeicbfmyzdfdnyxj6gndcjflup3gdpvodemrcjehpjsimx3v73jz3yy", pad: false },
  { key: "figure", label: "THE CITIZEN",  year: "REVEAL",  desc: "Figurative citizen — the soul",
    cid: "bafybeifax6nksc7h7m3duztjbrpy3e4bnyz3k3nj6xqcdleqsnpod622vi", pad: true },
  { key: "geo",    label: "RESTORED",     year: "NOW",     desc: "Restored form — the signal resolved",
    cid: "bafybeifwo4evkdoyaqvrahn522i3ahs7yf7gqya5heaiakddmyiacxb2s4", pad: true },
];

const pad4 = (n: number) => String(n).padStart(4, "0");
const formUrl = (f: Form, id: number) => `${GW}${f.cid}/${f.pad ? pad4(id) : id}.jpg`;

export default function EvolutionPage() {
  const [input, setInput] = useState("11");
  const [id, setId] = useState(11);
  const [cur, setCur] = useState(FORMS.length - 1); // open on RESTORED
  const [glitch, setGlitch] = useState(false);

  // read ?id= on load (so OpenSea animation_url / shared links deep-link)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = parseInt(p.get("id") || p.get("token") || "", 10);
    if (q >= 1 && q <= 4040) { setId(q); setInput(String(q)); }
  }, []);

  const go = useCallback((i: number) => {
    if (i < 0 || i >= FORMS.length || i === cur) return;
    setCur(i);
    setGlitch(true);
    setTimeout(() => setGlitch(false), 220);
  }, [cur]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(Math.min(cur + 1, FORMS.length - 1));
      if (e.key === "ArrowLeft") go(Math.max(cur - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, go]);

  function load() {
    const n = parseInt(input.trim(), 10);
    if (n >= 1 && n <= 4040) { setId(n); setCur(FORMS.length - 1); }
  }

  return (
    <main className="min-h-screen bg-[#07070a] text-[#e9e9ee]">
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="display-h-serif text-4xl mb-1">Signal Evolution</h1>
        <p className="text-sm text-[#8a8a93] mb-6">
          Every citizen has worn four forms. The signal broke, errored, took shape, and resolved.
        </p>

        {/* token picker */}
        <div className="flex gap-2 mb-5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="token # (1–4040)"
            className="bg-[#15151b] border border-[#2a2a33] rounded-lg px-3 py-2 text-sm w-40 outline-none focus:border-[#e8b54e]"
          />
          <button onClick={load}
            className="bg-[#15151b] border border-[#2a2a33] rounded-lg px-4 py-2 text-sm hover:border-[#e8b54e]">
            View #{pad4(id)}
          </button>
        </div>

        {/* stage */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0d0d12] ring-1 ring-[#1c1c22]">
          {FORMS.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={f.key} src={formUrl(f, id)} alt={f.label}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: i === cur ? 1 : 0 }} />
          ))}
          {glitch && (
            <div className="absolute inset-0 pointer-events-none opacity-60"
              style={{ background: "repeating-linear-gradient(0deg,#0000 0 2px,#0003 2px 3px)" }} />
          )}
          <div className="absolute left-3 top-3 bg-black/70 border border-white/20 rounded-full px-3 py-1 text-xs">
            #<b className="text-[#e8b54e]">{pad4(id)}</b>
          </div>
          <div className="absolute right-3 top-3 text-[11px] tracking-[2px] text-[#5a5a66]">404 · FREELON CITY</div>
          <div className="absolute left-3 bottom-3 right-3 text-[13px] text-[#bfbfc8] drop-shadow">
            <span className="text-[#e8b54e] font-semibold">{FORMS[cur].year}</span> · {FORMS[cur].desc}
          </div>
        </div>

        {/* progress dots */}
        <div className="flex gap-2 mt-4 mb-3">
          {FORMS.map((f, i) => (
            <button key={f.key} onClick={() => go(i)}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: i === cur ? "#e8b54e" : "#26262e" }} aria-label={f.label} />
          ))}
        </div>

        {/* form buttons */}
        <div className="flex gap-2 flex-wrap justify-center">
          {FORMS.map((f, i) => (
            <button key={f.key} onClick={() => go(i)}
              className="rounded-lg px-3.5 py-2 text-xs border transition-colors"
              style={{
                borderColor: i === cur ? "#e8b54e" : "#2a2a33",
                background: i === cur ? "#1d1810" : "#15151b",
                color: i === cur ? "#e8b54e" : "#e9e9ee",
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#55555f] text-center mt-3">
          The signal evolves. Use ← → or tap a form to move through the reveals.
        </p>
      </div>
    </main>
  );
}
