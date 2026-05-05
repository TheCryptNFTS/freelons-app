"use client";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { SiweMessage } from "siwe";

export function FreelonsConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [authed, setAuthed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.session?.wallet) setAuthed(d.session.wallet);
    });
  }, []);

  // Auto-sign when address connects but not yet authed
  useEffect(() => {
    if (isConnected && address && !authed && !busy) {
      doSign();
    }
  }, [isConnected, address, authed]);

  async function doSign() {
    if (!address) return;
    setBusy(true);
    try {
      const nonce = await fetch("/api/auth/nonce").then(r => r.text());
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to FREELONS — confirm you control this wallet.",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id || 1,
        nonce,
      });
      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ account: address, message: prepared });
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prepared, signature }),
      });
      const d = await r.json();
      if (d.ok) {
        setAuthed(d.wallet);
        localStorage.setItem("freelons_wallet", d.wallet);
        window.dispatchEvent(new Event("freelons-wallet-changed"));
      }
    } catch (e) {
      console.warn("sign rejected", e);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setAuthed(null);
    localStorage.removeItem("freelons_wallet");
    window.dispatchEvent(new Event("freelons-wallet-changed"));
    disconnect();
  }

  if (authed) {
    return (
      <button
        onClick={signOut}
        className="text-manila/80 hover:text-purple text-[10px] tracking-[2px]"
        title="Sign out"
      >
        {authed.slice(0, 6)}...{authed.slice(-4)} ✕
      </button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const ready = mounted;
        if (!ready) return null;
        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="text-manila hover:text-purple text-[10px] tracking-[2px]"
            >
              CONNECT WALLET ▸
            </button>
          );
        }
        // connected, not yet siwe'd
        return (
          <button
            onClick={doSign}
            disabled={busy}
            className="text-purple-glow hover:text-purple text-[10px] tracking-[2px]"
          >
            {busy ? "SIGNING..." : "SIGN IN ▸"}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
