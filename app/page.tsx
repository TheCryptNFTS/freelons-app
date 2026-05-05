import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import HexBadge from "@/components/HexBadge";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleArrow, ScribbleCircle, ScribbleUnderline, Redacted, Signature, ArrowUp, FlameMark, ForwardMark } from "@/components/Scribble";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Nav />
      <OverrideBanner />

      {/* HERO */}
      <section className="relative px-4 pt-16 md:pt-28 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto pl-4 md:pl-12">
          <div className="text-manila/60 text-[11px] tracking-[5px] flex items-baseline gap-4 typewriter">
            <span>FILE</span><span style={{ color: "var(--mustard)" }}>FHD-1986-X</span>
            <span className="opacity-50">·</span>
            <span>CLEARANCE</span><span style={{ color: "var(--purple-glow)" }}>BLUE</span>
            <span className="opacity-50 hidden md:inline">·</span>
            <span className="hidden md:inline opacity-70">DATE: <Redacted text="00.00.0000" /></span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative mt-6">
          <div className="md:pl-32">
            <h1 className="display-massive text-manila">404 HEX</h1>
            <h1 className="display-massive text-manila -mt-4 md:-mt-8 ml-0 md:ml-[0.6em]" style={{ color: "var(--purple-glow)" }}>
              NOT FOUND.
            </h1>
          </div>

          <div className="md:absolute md:top-32 md:left-4 md:max-w-xs mt-6 md:mt-0 z-10">
            <p className="display-h-serif" style={{ color: "var(--manila)", fontSize: "clamp(28px, 5vw, 56px)" }}>
              "we noticed."
            </p>
            <ScribbleUnderline width={180} color="#b8523a" className="mt-2" />
          </div>

          <div className="hidden md:block absolute -top-4 right-4 lg:right-12">
            <div className="relative">
              <HexBadge size={140} variant="purple" />
              <span className="margin-note hidden md:block" style={{ top: -12, right: -100, width: 120 }}>
                "the only one that<br />still works"
              </span>
            </div>
          </div>

          <div className="mt-12 md:mt-16 grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-7 md:pl-32">
              <p className="text-manila/80 typewriter text-sm md:text-base leading-relaxed max-w-xl">
                The hex was removed in <Redacted text="2021" />. We didn't forget.
                Some Freelons are linked to public signals. <em style={{ color: "var(--mustard)" }}>You won't know until you check.</em>
              </p>
              <div className="mt-8 flex gap-4 flex-wrap">
                <Link href="/check"><button className="btn-primary">CHECK YOUR SIGNAL</button></Link>
                <Link href="/signal" className="btn-ghost" style={{ color: "var(--manila)", borderColor: "var(--manila)", boxShadow: "4px 4px 0 var(--manila)" }}>SEND TRANSMISSION</Link>
              </div>
            </div>

            <div className="md:col-span-4 md:col-start-9 relative">
              <div className="text-right">
                <div className="text-mustard text-xs tracking-[5px] mb-2" style={{ color: "var(--mustard)" }}>UNRESOLVED</div>
                <div className="display-mono" style={{ color: "var(--manila)" }}>1,289</div>
                <div className="text-manila/60 text-xs tracking-[3px] mt-1 typewriter">days and counting</div>
              </div>
              <ScribbleArrow size={70} color="#c9a02d" className="absolute -top-4 -left-8 hidden md:block" />
            </div>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      {/* NEW LAYER DETECTED */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="paper tilt-1 relative" style={{ marginLeft: "0", marginRight: "8%" }}>
            <div className="file-tab left">CASE-002 / SIGNAL LINK</div>
            <div className="punch-holes"><div /><div /><div /></div>
            <div className="absolute top-10 right-12 select-none pointer-events-none z-10">
              <div className="stamp" data-rot={4} data-text="NEW LAYER">NEW LAYER</div>
            </div>

            <div className="px-12 md:px-16 py-12 md:py-16 relative z-10">
              <div className="text-[11px] tracking-[3px] flex justify-between items-baseline">
                <span>FREELONS — HEX SIGNAL DIVISION</span>
                <span>FILE: <b>FHD-1986-L</b></span>
              </div>
              <div className="border-b border-ink/40 mt-2" />

              <div className="mt-10 grid md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <h2 className="display-h-serif">New Layer <br /><span style={{ color: "var(--purple)" }}>Detected.</span></h2>
                  <ScribbleUnderline width={300} color="#b8523a" className="mt-4" />
                </div>
                <div className="md:col-span-4 flex md:justify-end items-start mt-4 md:mt-0">
                  <HexBadge size={150} variant="ink" />
                </div>
              </div>

              <p className="typewriter text-base mt-10 max-w-2xl leading-relaxed">
                Some Freelons are now linked to public X signals. Each tracked Freelon
                references a handle's posting activity — <span className="font-bold">RISING</span>,{" "}
                <span style={{ color: "var(--salmon)" }} className="font-bold">SPIKING</span>, or{" "}
                <span className="opacity-60 font-bold">QUIET</span>.
              </p>

              <p className="handwritten text-2xl mt-8" style={{ color: "var(--ink)" }}>
                you won't know which ones are linked <em>until you check.</em>
              </p>

              <div className="mt-10 grid md:grid-cols-3 gap-8 typewriter text-sm">
                <div className="border-l-2 border-ink/40 pl-4">
                  <div className="display-h-sm flex items-center gap-2" style={{ fontSize: "32px", color: "var(--purple-glow)" }}>RISING <ArrowUp size={26} /></div>
                  <p className="text-xs opacity-80 mt-1">Steady upward signal. Trending strong.</p>
                </div>
                <div className="border-l-2 border-ink/40 pl-4">
                  <div className="display-h-sm flex items-center gap-2" style={{ fontSize: "32px", color: "var(--salmon)" }}>SPIKING <FlameMark size={26} /></div>
                  <p className="text-xs opacity-80 mt-1">Sudden burst. Activity off-chart.</p>
                </div>
                <div className="border-l-2 border-ink/40 pl-4">
                  <div className="display-h-sm" style={{ fontSize: "32px", color: "var(--manila-dark)" }}>QUIET —</div>
                  <p className="text-xs opacity-80 mt-1">Flat for now. Quiet ones don't stay quiet.</p>
                </div>
              </div>

              <div className="mt-12 flex gap-3 flex-wrap items-center">
                <Link href="/check"><button className="btn-primary">CHECK YOUR FREELON ▸</button></Link>
                <span className="label-mustard">SOME ARE LINKED</span>
              </div>

              <p className="margin-note hidden md:block" style={{ top: "65%", right: -40, width: 200 }}>
                we don't track people<br />we track signal
              </p>

              <div className="mt-16 flex justify-between items-end">
                <div>
                  <div className="border-b border-ink/40 pb-1 inline-block min-w-[260px]">
                    <Signature name="The Freelons Committee" />
                  </div>
                  <div className="text-[10px] tracking-[3px] mt-1 opacity-70">SIGNED · ON FILE</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[3px] opacity-70">STATUS</div>
                  <div className="label-purple mt-1">LIVE</div>
                </div>
              </div>
            </div>

            <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
              <div className="display-h-sm" style={{ fontSize: "32px", letterSpacing: "5px" }}>
                404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span>
              </div>
              <div className="hidden md:block opacity-80 typewriter text-xs">END OF DOCUMENT · PG 02/03</div>
            </div>
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="relative px-4 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="paper tilt-2 relative" style={{ marginLeft: "10%", marginRight: "0" }}>
            <div className="file-tab right">DAILY · ACTION</div>
            <div className="absolute top-12 left-10 select-none pointer-events-none z-10">
              <div className="stamp green" data-rot={1} data-text="POSTED">POSTED</div>
            </div>

            <div className="px-10 md:px-16 py-12 md:py-16 relative z-10">
              <div className="grid md:grid-cols-12 gap-10 items-start">
                <div className="md:col-span-5">
                  <div className="text-[11px] tracking-[5px] opacity-70 typewriter mb-3">PROTOCOL · 24h LOOP</div>
                  <h2 className="display-h" style={{ fontSize: "clamp(64px, 12vw, 144px)" }}>RULES.</h2>
                  <ScribbleUnderline width={240} color="#c9a02d" className="-mt-2" />

                  <div className="mt-10 hidden md:block relative">
                    <ScribbleCircle size={170} color="#b8523a" className="absolute -top-4 -left-4" />
                    <div className="relative z-10 pt-12 pl-8 max-w-[180px]">
                      <p className="handwritten text-lg leading-snug" style={{ color: "var(--ink)" }}>
                        the strongest signal<br />
                        is the one that<br />
                        <em>keeps going.</em>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-8">
                  <div className="flex gap-6 items-start">
                    <span className="display-h-serif" style={{ fontSize: "72px", color: "var(--purple)" }}>01</span>
                    <div className="pt-3">
                      <p className="display-h-sm" style={{ fontSize: "44px" }}>CHECK.</p>
                      <p className="typewriter text-sm opacity-80 mt-1">your wallet. see which Freelons are linked.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start" style={{ marginLeft: "30px" }}>
                    <span className="display-h-serif" style={{ fontSize: "72px", color: "var(--purple)" }}>02</span>
                    <div className="pt-3">
                      <p className="display-h-sm" style={{ fontSize: "44px" }}>POST.</p>
                      <p className="typewriter text-sm opacity-80 mt-1">share your linked Freelon. mark the signal.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <span className="display-h-serif" style={{ fontSize: "72px", color: "var(--purple)" }}>03</span>
                    <div className="pt-3">
                      <p className="display-h-sm" style={{ fontSize: "44px" }}>WATCH.</p>
                      <p className="typewriter text-sm opacity-80 mt-1">status flips every few hours. check again.</p>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-wrap items-center gap-4">
                    <Link href="/check"><button className="btn-primary">START THE LOOP ▸</button></Link>
                    <span className="label-mustard">SOME SIGNALS ARE STRONGER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      {/* STATS */}
      <section className="relative px-4 py-24 md:py-32">
        <div className="max-w-7xl mx-auto relative" style={{ minHeight: 400 }}>
          <div className="md:absolute md:top-0 md:left-0 mb-12 md:mb-0">
            <div className="text-mustard typewriter text-xs tracking-[5px] mb-2" style={{ color: "var(--mustard)" }}>SUPPLY</div>
            <div className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(120px, 18vw, 260px)" }}>4,040</div>
          </div>

          <div className="hidden md:block absolute top-24 left-[42%]">
            <ScribbleArrow size={120} color="#c9a02d" />
          </div>

          <div className="md:absolute md:top-12 md:right-12 md:rotate-3 mb-12 md:mb-0">
            <div className="text-salmon typewriter text-xs tracking-[5px] mb-2" style={{ color: "var(--salmon-pale)" }}>LINKED</div>
            <div className="display-h-serif" style={{ color: "var(--manila)", fontSize: "clamp(80px, 14vw, 200px)" }}>3.</div>
            <div className="handwritten text-base mt-2 max-w-[200px]" style={{ color: "var(--salmon-pale)" }}>
              and growing. <em>quietly.</em>
            </div>
          </div>

          <div className="md:absolute md:bottom-0 md:left-[20%]">
            <div className="text-purple-glow typewriter text-xs tracking-[5px] mb-2" style={{ color: "var(--purple-glow)" }}>COUNTING</div>
            <div className="display-mono" style={{ color: "var(--manila)", fontSize: "clamp(48px, 9vw, 120px)" }}>1,289d</div>
            <div className="text-manila/60 typewriter text-xs tracking-[3px] mt-1">unresolved · still climbing</div>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      <footer className="text-manila/50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <p className="display-h-sm text-center" style={{ color: "var(--manila)", fontSize: "20px", letterSpacing: "5px" }}>
            WE DON'T TRACK PEOPLE. <span style={{ color: "var(--purple-glow)" }}>WE TRACK SIGNAL.</span>
          </p>
          <p className="typewriter text-[11px] mt-6 opacity-60 max-w-2xl mx-auto text-center">
            This site references publicly available social data. No affiliation, partnership,
            ownership of identity, or endorsement is implied. Signal status is derived from
            public posting patterns. Freelons are independent NFTs and not officially associated with any handle referenced.
          </p>
          <div className="mt-8 flex justify-between items-baseline opacity-60">
            <div className="typewriter text-xs tracking-[4px]">
              FREELONS · HEX SIGNAL DIVISION
            </div>
            <div className="typewriter text-xs tracking-[4px]">
              v1.0 · END OF TRANSMISSION
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
