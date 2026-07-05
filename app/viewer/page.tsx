"use client";
import { useEffect, useState, useCallback } from "react";

// Clean version carousel for OpenSea animation_url. Just the image + arrows, no text.
// Per-token: only includes forms that ACTUALLY EXIST for that token (no broken images).
const GW = "https://ipfs.io/ipfs/";
type Form = { cid: string; pad: boolean; geoOnly?: boolean };
// order = oldest -> newest; opens on the NEWEST that exists for the token
const FORMS: Form[] = [
  { cid: "bafybeihfplcm2hottjdoweqmwhzfinpvyxuoa6dqndqngtuupu67qjvy6i", pad: true },  // 1 hex-card
  { cid: "bafybeicbfmyzdfdnyxj6gndcjflup3gdpvodemrcjehpjsimx3v73jz3yy", pad: false }, // 2 report
  { cid: "bafybeifax6nksc7h7m3duztjbrpy3e4bnyz3k3nj6xqcdleqsnpod622vi", pad: true },  // 3 figurative
  { cid: "bafybeifwo4evkdoyaqvrahn522i3ahs7yf7gqya5heaiakddmyiacxb2s4", pad: true, geoOnly: true }, // 4 geometric (wave tokens only)
];
const pad4 = (n: number) => String(n).padStart(4, "0");
const urlFor = (f: Form, id: number) => `${GW}${f.cid}/${f.pad ? pad4(id) : id}.jpg`;

export default function ViewerPage() {
  const [id, setId] = useState(0);
  const [forms, setForms] = useState<Form[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    // resolve token id from ?id= / #N / any digits in url
    const p = new URLSearchParams(window.location.search);
    let q = parseInt(p.get("id") || p.get("token") || "", 10);
    if (!(q >= 1 && q <= 4040)) q = parseInt((window.location.hash || "").replace(/[^0-9]/g, ""), 10);
    if (!(q >= 1 && q <= 4040)) q = 11;
    setId(q);
    // which forms exist for this token? all tokens have forms 1-3; form 4 only if regenerated
    fetch("/geo_tokens.json").then(r => r.json()).then((geo: number[]) => {
      const hasGeo = geo.includes(q);
      const avail = FORMS.filter(f => !f.geoOnly || hasGeo);
      setForms(avail);
      setI(avail.length - 1); // open on newest existing
    }).catch(() => {
      const avail = FORMS.filter(f => !f.geoOnly);
      setForms(avail); setI(avail.length - 1);
    });
  }, []);

  const move = useCallback((d: number) => {
    setI(prev => Math.min(Math.max(prev + d, 0), forms.length - 1));
  }, [forms.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  if (!id || forms.length === 0) return <div style={{ background: "#000", width: "100vw", height: "100vh" }} />;

  const atStart = i <= 0, atEnd = i >= forms.length - 1;
  return (
    <div style={{
      background: "#000", width: "100vw", height: "100vh", margin: 0,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative",
    }}>
      {forms.map((f, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k} src={urlFor(f, id)} alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain",
            opacity: k === i ? 1 : 0, transition: "opacity .35s ease",
          }} />
      ))}
      {/* arrows — only show when there's somewhere to go */}
      {!atStart && (
        <button onClick={() => move(-1)} aria-label="previous"
          style={arrowStyle("left")}>‹</button>
      )}
      {!atEnd && (
        <button onClick={() => move(1)} aria-label="next"
          style={arrowStyle("right")}>›</button>
      )}
    </div>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: "12px",
    width: 44, height: 64, borderRadius: 10,
    background: "rgba(0,0,0,.4)", color: "#fff", border: "1px solid rgba(255,255,255,.25)",
    fontSize: 30, lineHeight: "60px", cursor: "pointer", padding: 0,
    backdropFilter: "blur(2px)",
  } as React.CSSProperties;
}
