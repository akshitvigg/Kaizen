"use client"

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";



export default function Home() {
  const endpoint = clusterApiUrl("devnet")
  const wallet = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallet}>
        <WalletModalProvider>
          <WalletMultiButton>
          </WalletMultiButton>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
