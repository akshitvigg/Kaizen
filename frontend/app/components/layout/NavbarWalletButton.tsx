"use client";

import React, { useState } from "react";
import { useWallet } from "../wallet/WalletProvider";

function truncate(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function NavbarWalletButton({ isMobile = false }: { isMobile?: boolean }) {
  const { address, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    if (!address) return;
    // Choose cluster you use (devnet/mainnet-beta)
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, "_blank");
  };

  if (!address) {
    return (
      <button
        onClick={() => connect()}
        className={`bg-[#14F195] hover:bg-[#12d182] text-black ${isMobile ? "w-full" : ""} px-3 py-2 rounded`}
      >
        Connect
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${isMobile ? "flex-col items-stretch" : ""}`}>
      <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded flex items-center gap-2">
        <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">{truncate(address)}</span>

      </div>
      <button
        onClick={() => disconnect()}
        className="text-red-500 border border-red-500/20 hover:bg-red-500/10 px-3 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
