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

      {address ? (
        <div>
          <p>Connected: {address}</p>
          <p className="text-sm text-gray-500">Redirecting to Dashboard</p>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="px-6 py-3 rounded border border-gray-500 bg-black"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
