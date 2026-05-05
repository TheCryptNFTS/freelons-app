// On-chain helpers. Uses public RPC by default; set FREELONS_RPC_URL for production.
export const CONTRACT = "0xa79e73c9828db3fcd7c77be7d9f356fb684b5504";
const RPC = process.env.FREELONS_RPC_URL || "https://eth-mainnet.public.blastapi.io";

// ownerOf(uint256) => 0x6352211e
export async function ownerOf(tokenId: number): Promise<string | null> {
  const hexId = tokenId.toString(16).padStart(64, "0");
  const data = `0x6352211e${hexId}`;
  try {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: CONTRACT, data }, "latest"],
      }),
      cache: "no-store",
    });
    const j = await r.json();
    const result = j.result || "0x";
    if (!result || result === "0x" || result.length < 66) return null;
    // Last 40 hex chars = address
    return "0x" + result.slice(-40).toLowerCase();
  } catch (e) {
    console.error("ownerOf error:", e);
    return null;
  }
}

export function ensCacheKey(addrOrEns: string) {
  return addrOrEns.toLowerCase();
}

// balanceOf(address) => 0x70a08231
export async function balanceOf(wallet: string): Promise<number> {
  const padded = wallet.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const data = `0x70a08231${padded}`;
  try {
    const r = await fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_call",
        params: [{ to: CONTRACT, data }, "latest"],
      }),
      cache: "no-store",
    });
    const j = await r.json();
    return parseInt(j.result || "0x0", 16);
  } catch {
    return 0;
  }
}

// Scan Transfer events to find tokens owned by a wallet.
// For production, swap to Alchemy `getNFTs` endpoint for fast lookups.
// Public RPC: this is slow. Use Alchemy if NEXT_PUBLIC_ALCHEMY_KEY is set.
export async function tokensOwnedBy(wallet: string): Promise<number[]> {
  const w = wallet.toLowerCase();
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || process.env.ALCHEMY_KEY;
  if (alchemyKey) {
    try {
      const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${w}&contractAddresses[]=${CONTRACT}&withMetadata=false&pageSize=100`;
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      const ids = (d.ownedNfts || []).map((n: any) => parseInt(n.tokenId, 10)).filter(Boolean);
      return ids.sort((a: number, b: number) => a - b);
    } catch (e) {
      console.error("alchemy lookup failed:", e);
    }
  }
  // Fallback: just confirm balance, return synthetic ids if we know the wallet from store
  const bal = await balanceOf(wallet);
  if (bal === 0) return [];
  // We can't enumerate without indexer — return empty and let UI explain
  return [];
}
