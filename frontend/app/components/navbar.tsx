"use client";
import { NavbarWalletButton } from "./layout/NavbarWalletButton";
import React, { useEffect, useState } from "react";
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
        const publicKey = new (await import('@solana/web3.js')).PublicKey(address);
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid #333",
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href="#" style={{ color: "#ccc", textDecoration: "none", fontSize: 18 }}>
          leaderboards
        </a>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* SOL Balance Display */}
        <div
          aria-label="SOL Balance"
          title="SOL Balance"
          style={{
            minWidth: 80,
            height: 28,
            borderRadius: 999,
            border: "1px solid #888",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
          }}
        >
          <span style={{ color: "#ccc", fontSize: 14 }}>
            {loading ? "..." : `${balance.toFixed(4)} SOL`}
          </span>
        </div>

        {/* Profile circle */}
        <div className="hidden md:flex items-center gap-2">
          <NavbarWalletButton />
        </div>
      </div>
    </header>
  );
}


