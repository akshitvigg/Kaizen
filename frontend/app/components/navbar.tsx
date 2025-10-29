
"use client";

import React, { useEffect, useState } from "react";
import { NavbarWalletButton } from "./layout/NavbarWalletButton";
import { useWallet } from "./wallet/WalletProvider";
import { connection } from "../../lib/program";

export default function Navbar(): React.ReactElement {
  const { address } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance(0);
        return;
      }

      setLoading(true);
      try {
        const { PublicKey } = await import("@solana/web3.js");
        const publicKey = new PublicKey(address);
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / 1e9);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm">
              <span
                className="text-black font-bold text-base leading-none"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                改善
              </span>
            </div>
            <span className="hidden sm:inline text-white font-bold text-lg tracking-tight">
              Kaizen
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <a
              href="#leaderboards"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-3"
            >
              Leaderboards
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            <div
              aria-label="SOL Balance"
              title="SOL Balance"
              className="hidden sm:flex min-w-20 h-8 border border-white/30 rounded-md bg-transparent px-3 items-center justify-center"
            >
              <span className="text-gray-300 text-xs font-medium">
                {loading ? "..." : `${balance.toFixed(4)} SOL`}
              </span>
            </div>

            {/* Wallet Button */}
            <NavbarWalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}

