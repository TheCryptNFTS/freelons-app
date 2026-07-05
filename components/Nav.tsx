"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import StreakStrip from "./StreakStrip";
import { FreelonsConnectButton } from "./ConnectButton";

const links = [
  { href: "/", label: "BASE" },
  { href: "/check", label: "CHECK" },
  { href: "/signal", label: "SIGNAL" },
  { href: "/oracle", label: "ORACLE" },
  { href: "/leaderboard", label: "RANKS" },
  { href: "/wall", label: "WALL" },
];

export default function Nav() {
  const pathname = usePathname();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    setWallet(localStorage.getItem("freelons_wallet"));
    const onStorage = () => setWallet(localStorage.getItem("freelons_wallet"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("freelons-wallet-changed", onStorage as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("freelons-wallet-changed", onStorage as any);
    };
  }, []);

  function disconnect() {
    localStorage.removeItem("freelons_wallet");
    setWallet(null);
    window.dispatchEvent(new Event("freelons-wallet-changed"));
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-purple/30" style={{ background: "#1a1611ee", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-manila font-display text-2xl tracking-[5px]">
            FREELONS
          </Link>
          <div className="flex gap-1 text-manila font-mono text-xs">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2 tracking-[3px] transition-colors ${
                    active ? "text-purple border-b-2 border-purple" : "text-manila/70 hover:text-purple"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="text-[10px] text-manila/70 tracking-[2px]">
            <FreelonsConnectButton />
          </div>
        </div>
      </nav>
      <StreakStrip />
    </>
  );
}
