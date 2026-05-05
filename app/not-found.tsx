import Link from "next/link";
import HexBadge from "@/components/HexBadge";
import { ScribbleUnderline, Redacted } from "@/components/Scribble";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full text-center">
        <div className="text-mustard typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>
          FILE FHD-1986-X · MISSING / REDACTED
        </div>
        <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(120px, 22vw, 320px)" }}>
          404.
        </h1>
        <h2 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.2em" }}>
          page not found.
        </h2>
        <ScribbleUnderline width={300} color="#c9a02d" className="mx-auto mt-3" />

        <div className="flex justify-center mt-8">
          <HexBadge size={140} variant="purple" />
        </div>

        <p className="handwritten text-2xl mt-8" style={{ color: "var(--manila)" }}>
          this transmission was <Redacted text="REDACTED" />.
        </p>
        <p className="typewriter text-sm tracking-[2px] mt-4 opacity-70" style={{ color: "var(--manila)" }}>
          the page you were looking for doesn't exist.
        </p>

        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Link href="/"><button className="btn-primary">RETURN TO BASE ▸</button></Link>
          <Link href="/signal" className="btn-ghost" style={{ color: "var(--manila)", borderColor: "var(--manila)", boxShadow: "4px 4px 0 var(--manila)" }}>SEND SIGNAL</Link>
        </div>
      </div>
    </main>
  );
}
