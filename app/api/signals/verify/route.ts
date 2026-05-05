import { NextResponse } from "next/server";
import { store } from "@/lib/store";

// POST /api/signals/verify
// body: { signalId, tweetUrl }
// Fetches the tweet via X oEmbed (no auth required), checks the hash appears in the text.
export async function POST(req: Request) {
  const { signalId, tweetUrl } = await req.json();
  if (!signalId || !tweetUrl) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // Find the pending signal
  const sig = store.signals.find(s => s.id === signalId);
  if (!sig) return NextResponse.json({ error: "signal not found" }, { status: 404 });
  if (sig.status === "verified") return NextResponse.json({ ok: true, signal: sig, alreadyVerified: true });
  if (sig.status === "expired") return NextResponse.json({ error: "expired", signal: sig }, { status: 410 });
  if (!sig.hash) return NextResponse.json({ error: "no_hash" }, { status: 500 });

  // Extract tweet ID from URL
  const m = tweetUrl.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/);
  if (!m) return NextResponse.json({ error: "invalid_tweet_url" }, { status: 400 });
  const tweetId = m[1];

  // Use Twitter's public oEmbed endpoint (no auth required, no rate limits for reads)
  // Returns HTML containing the tweet text
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
    const r = await fetch(oembedUrl, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: "tweet_fetch_failed", status: r.status }, { status: 502 });
    const data = await r.json();
    const html = String(data.html || "");
    const authorName = String(data.author_name || "");
    const authorUrl = String(data.author_url || "");

    // Check the unique hash appears in the tweet content
    if (!html.toUpperCase().includes(sig.hash.toUpperCase())) {
      return NextResponse.json({
        error: "hash_not_in_tweet",
        expected: sig.hash,
        message: "Tweet must contain the unique hash. Re-post with the hash visible.",
      }, { status: 400 });
    }

    // Mark verified
    const updated = store.verifySignal(signalId, tweetId);
    return NextResponse.json({
      ok: true,
      signal: updated,
      tweet: { id: tweetId, authorName, authorUrl },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "verify_error", detail: e?.message }, { status: 500 });
  }
}
