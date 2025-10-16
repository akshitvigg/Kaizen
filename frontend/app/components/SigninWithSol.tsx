"use client";

import React from "react";
import { useWallet } from "./wallet/WalletProvider";

export default function SignInWithSol() {
  const { connect, connecting, address } = useWallet();

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Sign in with Solana</h1>

      {address ? (
        <div>
          <p>Connected: {address}</p>
          <p className="text-sm text-gray-500">You can close this and use the Navbar</p>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="px-4 py-2 rounded bg-[#14F195] hover:bg-[#12d182]"
        >
          {connecting ? "Connecting..." : "Connect Phantom"}
        </button>
      )}
    </div>
  );
}
