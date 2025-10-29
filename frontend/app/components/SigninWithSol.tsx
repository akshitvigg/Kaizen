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
    <div className="">

      {address ? (
        <div>
          <p>Connected: {address}</p>
          <p className="text-sm text-gray-500">Redirecting to Dashboard</p>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="px-6 py-3 rounded border border-gray-200 bg-black hover:bg-white hover:text-black hover:cursor-pointer"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
