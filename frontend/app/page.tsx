'use client';

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Hero from "./components/hero";
import { useWallet } from "./components/wallet/WalletProvider";

export default function Page() {
  const { address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (address) {
      router.replace("/dashboard");
    }
  }, [address, router]);

  return (
    <div>
      <Hero />
    </div>
  );
}
