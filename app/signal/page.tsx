"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import OverrideBanner from "@/components/OverrideBanner";
import HexBadge from "@/components/HexBadge";
import MarqueeStrip from "@/components/MarqueeStrip";
import { ScribbleArrow, ScribbleUnderline, Redacted, Signature } from "@/components/Scribble";
import { useAccount } from "wagmi";

export default function SignalPage() {
  const { address, isConnected } = useAccount();
  const [session, setSession] = useState<{ wallet: string } | null>(null);
  const [tokenId, setTokenId] = useState("");
  const [pending, setPending] = useState<any>(null);
  const [confirmed, setConfirmed] = useState<any>(null);
  const [tweetUrl, setTweetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [replyTargets, setReplyTargets] = useState<any[]>([]);
  const [demoWallet, setDemoWallet] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setSession(d.session));
  }, []);

  const wallet = session?.wallet || demoWallet;
  const usingDemo = !session?.wallet && !!demoWallet;

  async function send() {
    if (!wallet || !tokenId) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, tokenId, tier: "Common" }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.error === "rate_limited") setErr(`Rate limited. ${d.retryIn}s.`);
        else if (d.error === "auth_required") setErr("Connect your wallet first.");
        else if (d.error === "not_owner") setErr(`You don't own #${tokenId}. Owner is ${d.owner?.slice(0,10)}...`);
        else setErr(d.error || "error");
        return;
      }
      setPending(d);
      localStorage.setItem("freelons_wallet", wallet.toLowerCase());
      window.dispatchEvent(new Event("freelons-wallet-changed"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyTweet() {
    if (!pending?.signal?.id || !tweetUrl) return;
    setVerifying(true);
    setErr(null);
    try {
      const r = await fetch("/api/signals/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: pending.signal.id, tweetUrl }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.message || d.error || "verify failed");
        return;
      }
      // Build confirmed payload
      const profileR = await fetch(`/api/profile?wallet=${encodeURIComponent(wallet)}`);
      const profileD = await profileR.json();
      const wallR = await fetch("/api/wall");
      const wallD = await wallR.json();
      const last60 = (wallD.signals || []).filter((s: any) => Date.now() - s.postedAt < 3600 * 1000);
      const distinct = new Set(last60.map((s: any) => s.wallet)).size;
      setConfirmed({
        signal: d.signal,
        tweet: d.tweet,
        socialProof: { distinctWalletsLast60: distinct },
        closest: profileD.stats?.closest,
        stats: profileD.stats,
      });
      // Reply targets
      const tr = await fetch(`/api/reply-targets?wallet=${encodeURIComponent(wallet)}`);
      const td = await tr.json();
      setReplyTargets(td.targets || []);
    } finally {
      setVerifying(false);
    }
  }

  function shareText() {
    return encodeURIComponent(
      `404 HEX NOT FOUND.\n\nI hold the signal. Freelon #${tokenId} active.\n\n${pending?.hash || ""}\n\nBring back the hex on X. #FREELONS`
    );
  }

  return (
    <>
      <Nav />
      <OverrideBanner />
      <MarqueeStrip />

      {!confirmed && !pending ? (
        <main className="relative px-4 py-16 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-12 gap-10 items-start">
              <div className="md:col-span-6 md:pl-8">
                <div className="text-mustard typewriter text-xs tracking-[5px] mb-3" style={{ color: "var(--mustard)" }}>
                  PROTOCOL · DAILY ACTION · 24h LOOP
                </div>
                <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(96px, 18vw, 240px)" }}>SEND</h1>
                <h1 className="display-h-serif" style={{ color: "var(--purple-glow)", marginLeft: "0.5em", marginTop: "-0.25em" }}>the signal.</h1>
                <ScribbleUnderline width={280} color="#c9a02d" className="ml-12 mt-3" />

                <p className="handwritten text-xl mt-10 max-w-md" style={{ color: "var(--manila)", opacity: 0.85 }}>
                  one freelon. one daily transmission. <br />
                  the system is listening.
                </p>

                {!session && (
                  <div className="mt-8 paper p-6 max-w-md">
                    <p className="typewriter text-xs tracking-[3px] uppercase opacity-70 mb-2">DEMO MODE — ENS HANDLE</p>
                    <input
                      value={demoWallet}
                      onChange={(e) => setDemoWallet(e.target.value.toLowerCase())}
                      placeholder="vitalik.eth"
                      className="w-full px-3 py-2 text-sm"
                    />
                    <p className="typewriter text-[10px] mt-2 opacity-60">— or connect a wallet (top right) for real on-chain verification.</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-6 md:col-start-7">
                <div className="paper tilt-2 relative">
                  <div className="file-tab right">DAILY · INPUT</div>
                  <div className="absolute top-10 left-8 select-none pointer-events-none z-10">
                    <div className="stamp mustard" data-rot={1} data-text="PENDING">PENDING</div>
                  </div>
                  <div className="px-10 md:px-14 py-12 md:py-14 relative z-10">
                    <div className="text-[10px] tracking-[3px] flex justify-between opacity-70">
                      <span>FREELONS — HEX SIGNAL DIVISION</span>
                      <span>FILE: <b>FHD-1986-S</b></span>
                    </div>
                    <div className="border-b border-ink/40 mt-2" />
                    <h2 className="display-h-serif mt-8" style={{ fontSize: "clamp(48px, 7vw, 88px)" }}>Signal Check.</h2>

                    <div className="mt-10 space-y-6">
                      <div>
                        <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">01 · WALLET</label>
                        <div className="px-4 py-3 border-3 border-ink bg-black/5 typewriter text-sm tracking-[2px]">
                          {session ? (
                            <span><span className="opacity-60">SIGNED IN —</span> <b>{session.wallet.slice(0, 10)}...{session.wallet.slice(-4)}</b></span>
                          ) : usingDemo ? (
                            <span><span className="opacity-60">DEMO —</span> <b>{demoWallet}</b></span>
                          ) : (
                            <span className="opacity-60">connect wallet (top right) — or enter an ENS handle on the left</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] tracking-[4px] uppercase typewriter opacity-80 block mb-2">02 · FREELON TOKEN ID</label>
                        <input
                          value={tokenId}
                          onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))}
                          placeholder="333"
                          className="w-full px-4 py-3 text-sm"
                        />
                      </div>

                      <button disabled={!wallet || !tokenId || loading} onClick={send} className="btn-primary w-full">
                        {loading ? "GENERATING..." : "GENERATE SIGNAL ▸"}
                      </button>

                      {err && <p className="text-sm typewriter" style={{ color: "var(--salmon)" }}>{err}</p>}

                      <p className="typewriter text-[11px] leading-relaxed mt-6 opacity-70 italic">
                        you'll get a unique hash to include in your X post. we verify by reading the tweet.
                      </p>
                    </div>
                  </div>
                  <div className="bg-ink text-manila px-8 py-3 flex items-center justify-between">
                    <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span></div>
                    <span className="opacity-60 typewriter text-[10px]">PG 01/01</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

      // PENDING — show hash + post-and-verify flow
      ) : pending && !confirmed ? (
        <main className="relative px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-mustard typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>
                STEP 02 · POST TO X · THEN VERIFY
              </div>
              <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(80px, 14vw, 180px)" }}>POST IT.</h1>
              <h2 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.15em" }}>then come back.</h2>
            </div>

            <div className="paper tilt-1 relative">
              <div className="file-tab left">PENDING · {pending.signal.id.toUpperCase()}</div>
              <div className="absolute top-10 right-10 z-10">
                <div className="stamp mustard" data-rot={5} data-text="PENDING">PENDING</div>
              </div>
              <div className="px-10 md:px-14 py-12">
                {/* The hash */}
                <div className="mb-10">
                  <div className="typewriter text-[10px] tracking-[3px] opacity-70 mb-2">YOUR UNIQUE SIGNAL HASH</div>
                  <div className="display-massive leading-none" style={{ color: "var(--purple)", fontSize: "clamp(72px, 11vw, 140px)", letterSpacing: "-2px" }}>
                    {pending.hash}
                  </div>
                  <p className="handwritten text-base mt-3">paste this into your tweet. it's how we verify.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70 mb-2">STEP A · POST</div>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${shareText()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary block text-center"
                    >POST TO X ▸</a>
                    <p className="typewriter text-[11px] opacity-70 mt-2">
                      pre-filled with hash + hashtag. expires in 15 min.
                    </p>
                  </div>
                  <div>
                    <div className="typewriter text-[10px] tracking-[3px] opacity-70 mb-2">STEP B · PASTE TWEET URL</div>
                    <input
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      placeholder="https://x.com/you/status/1234..."
                      className="w-full px-3 py-3 text-sm"
                    />
                    <button
                      onClick={verifyTweet}
                      disabled={!tweetUrl || verifying}
                      className="btn-ghost w-full mt-2"
                    >{verifying ? "READING TWEET..." : "VERIFY POST ▸"}</button>
                  </div>
                </div>

                {err && <p className="typewriter text-sm mt-6" style={{ color: "var(--salmon)" }}>{err}</p>}

                <div className="mt-10 typewriter text-[11px] opacity-60 italic">
                  we read the tweet via X's oEmbed — no API key, no DMs, no permissions. as long as the hash is in the tweet, you're verified.
                </div>
              </div>
              <div className="bg-ink text-manila px-8 py-3 flex justify-between">
                <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span></div>
                <span className="opacity-60 typewriter text-[10px]">PENDING · 02</span>
              </div>
            </div>
          </div>
        </main>

      ) : (
        // VERIFIED — confirmed receipt + reply chain
        <main className="relative px-4 py-16 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            <div>
              <div className="text-center mb-2">
                <div className="text-mustard typewriter text-[11px] tracking-[6px] mb-3" style={{ color: "var(--mustard)" }}>
                  TWEET CONFIRMED · LOGGED · ACTIVE
                </div>
                <h1 className="display-massive" style={{ color: "var(--manila)", fontSize: "clamp(80px, 16vw, 220px)" }}>SIGNAL</h1>
                <h1 className="display-h-serif" style={{ color: "var(--purple-glow)", marginTop: "-0.2em" }}>verified.</h1>
              </div>

              <div className="paper tilt-1 mt-10 max-w-4xl mx-auto relative">
                <div className="file-tab mid">RECEIPT · NO. {confirmed.signal.id.toUpperCase()}</div>
                <div className="absolute top-10 right-10 z-10">
                  <div className="stamp green" data-rot={2} data-text="VERIFIED">VERIFIED</div>
                </div>

                <div className="px-10 md:px-16 py-12 md:py-14">
                  <div className="grid md:grid-cols-12 gap-8">
                    <div className="md:col-span-7">
                      <div className="text-[10px] tracking-[3px] opacity-70">ON-CHAIN + ON-X RECEIPT</div>
                      <ScribbleUnderline width={140} color="#5b3c8c" className="mt-1" />

                      <div className="mt-8 space-y-3 typewriter text-sm">
                        <div className="flex justify-between border-b border-dashed border-ink/30 pb-2">
                          <span className="opacity-70">TOKEN</span>
                          <span className="font-bold display-h-sm" style={{ fontSize: "32px", lineHeight: 1, color: "var(--purple)" }}>#{confirmed.signal.tokenId}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-ink/30 pb-2">
                          <span className="opacity-70">MULTIPLIER</span>
                          <span className="font-bold">{confirmed.signal.multiplier}×</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-ink/30 pb-2">
                          <span className="opacity-70">TWEET</span>
                          <a href={`https://x.com/i/status/${confirmed.tweet?.id}`} target="_blank" rel="noreferrer" className="font-bold underline">VIEW ▸</a>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-ink/30 pb-2">
                          <span className="opacity-70">HASH</span>
                          <span className="font-bold">{confirmed.signal.hash}</span>
                        </div>
                      </div>

                      <div className="mt-10">
                        <p className="handwritten text-2xl">
                          you just joined <span style={{ color: "var(--purple)" }}>{confirmed.socialProof?.distinctWalletsLast60 || 0}</span> others.
                        </p>
                        <p className="typewriter text-[11px] tracking-[2px] uppercase mt-1 opacity-70">
                          in the last 60 minutes.
                        </p>
                      </div>

                      {confirmed.closest && (
                        <div className="mt-8 border-t-2 border-dashed border-ink/40 pt-4">
                          <p className="typewriter text-[10px] tracking-[3px] uppercase opacity-70">CLOSEST AHEAD OF YOU</p>
                          <p className="display-h-sm mt-1" style={{ fontSize: "32px" }}>{confirmed.closest.wallet}</p>
                          <p className="typewriter text-xs opacity-80">+{confirmed.closest.gap} signals</p>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-5 flex flex-col items-center mt-2">
                      <HexBadge size={220} variant="purple" />
                      <span className="margin-note mt-4" style={{ position: "static", transform: "rotate(-4deg)" }}>
                        verified · stronger together
                      </span>
                      <Signature name="The Freelons Committee" className="mt-12" />
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3 flex-wrap">
                    <a href="/profile" className="btn-primary">VIEW STATUS</a>
                    <a href="/wall" className="btn-ghost">SEE THE WALL</a>
                  </div>
                </div>

                <div className="bg-ink text-manila px-8 py-4 flex items-center justify-between">
                  <div className="display-h-sm" style={{ fontSize: "28px", letterSpacing: "5px" }}>404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span></div>
                  <div className="hidden md:block opacity-80 typewriter text-xs">RECEIPT END · PG 01/02</div>
                </div>
              </div>
            </div>

            {replyTargets.length > 0 && (
              <div className="paper tilt-3 max-w-4xl mx-auto relative" style={{ marginLeft: "8%" }}>
                <div className="file-tab left">STEP 02 · REPLY CHAIN</div>
                <div className="absolute top-10 right-10 z-10">
                  <div className="stamp" data-rot={3} data-text="REPLY 2">REPLY 2</div>
                </div>
                <div className="px-10 md:px-14 py-12">
                  <div className="text-[10px] tracking-[3px] opacity-70">PROTOCOL · STEP 02</div>
                  <h3 className="display-h-serif mt-3" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>Reply to two.</h3>
                  <ScribbleUnderline width={180} color="#b8523a" className="mt-2" />
                  <p className="handwritten text-lg mt-6 max-w-md">these holders just sent a signal. reply to keep the chain alive.</p>

                  <div className="mt-8 space-y-1">
                    {replyTargets.map((t, i) => (
                      <div key={t.id} className="flex items-center justify-between py-3 border-b border-dashed border-ink/30">
                        <div className="flex items-center gap-4">
                          <span className="display-h-serif" style={{ fontSize: "44px", color: "var(--purple)" }}>0{i + 1}</span>
                          <div>
                            <p className="font-bold text-base">{t.wallet}</p>
                            <p className="typewriter text-[11px] opacity-70">FREELON #{t.tokenId} · {new Date(t.postedAt).toLocaleTimeString([], { hour12: false })}</p>
                          </div>
                        </div>
                        <a href={`https://twitter.com/search?q=${encodeURIComponent("from:" + t.wallet.replace(".eth", ""))}&f=live`} target="_blank" rel="noreferrer" className="btn-ghost text-sm">REPLY ▸</a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-ink text-manila px-8 py-3 flex justify-between">
                  <div className="display-h-sm" style={{ fontSize: "20px", letterSpacing: "4px" }}>404 HEX <span style={{ color: "var(--purple-glow)" }}>NOT FOUND</span></div>
                  <span className="opacity-60 typewriter text-[10px]">CHAIN · 02</span>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}
