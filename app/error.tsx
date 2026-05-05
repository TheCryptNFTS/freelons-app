"use client";
import { useEffect } from "react";
import Link from "next/link";
import { ScribbleUnderline, Redacted } from "@/components/Scribble";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // could send to logging service later
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full text-center">
        <div className="text-salmon typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--salmon-pale)" }}>
          SYSTEM EVENT · UNEXPECTED · LOGGED
        </div>
        <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(120px, 22vw, 320px)" }}>
          ERROR.
        </h1>
        <h2 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.2em" }}>
          signal interrupted.
        </h2>
        <ScribbleUnderline width={300} color="#b8523a" className="mx-auto mt-3" />

        <p className="handwritten text-2xl mt-10" style={{ color: "var(--manila)" }}>
          something <Redacted text="failed" /> on transmission.
        </p>
        <p className="typewriter text-xs tracking-[2px] mt-4 opacity-60" style={{ color: "var(--manila)" }}>
          {error?.message || "unknown error"}
        </p>

        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <button onClick={reset} className="btn-primary">RETRY ▸</button>
          <Link href="/" className="btn-ghost" style={{ color: "var(--manila)", borderColor: "var(--manila)", boxShadow: "4px 4px 0 var(--manila)" }}>RETURN TO BASE</Link>
        </div>
      </div>
    </main>
  );
}
