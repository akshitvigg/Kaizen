"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./wallet/WalletProvider";

export default function SignInWithSol() {
  const { connect, connecting, address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (address) {
      router.replace("/dashboard");
    }
  }, [address, router]);
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Sign in with Solana</h1>

      {address ? (
        <div>
          <p>Connected: {address}</p>
          <p className="text-sm text-gray-500">Redirecting to Dashboard</p>
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
