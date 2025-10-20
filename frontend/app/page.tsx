'use client';

import React from "react";
import Hero from "./components/hero";
import Dashboard from "./dashboard/page";
import SignInWithSol from "./components/SigninWithSol";
import { useWallet } from "./components/wallet/WalletProvider";

export default function Page() {
  const { address } = useWallet();

  // If no address, show the connect UI. When address becomes available
  // (SignInWithSol calls connect and WalletProvider updates), Dashboard will render.
  return (
    <div>
      <Hero />
      {address ? <Dashboard /> : <SignInWithSol />}
    </div>
  );
}
