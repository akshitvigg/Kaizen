"use client";

import React, { useState } from "react";
import { useWallet } from "./wallet/WalletProvider";
import { 
  createProgram, 
  getProvider, 
  getGlobalStatePDA, 
  getVaultPDA, 
  getFocusPoolVaultPDA, 
  getFailurePoolVaultPDA 
} from "../../lib/program";
import { PublicKey } from "@solana/web3.js";

export default function InitializeButton() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initializeGlobalState = async () => {
    if (!address) {
      setMessage("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const anyWindow: any = window;
      const provider = anyWindow?.solana;
      if (!provider) {
        throw new Error("No Solana provider found");
      }

      const wallet = {
        publicKey: new PublicKey(address),
        signTransaction: async (tx: any) => {
          const signed = await provider.signTransaction(tx);
          return signed;
        },
        signAllTransactions: async (txs: any[]) => {
          const signed = await provider.signAllTransactions(txs);
          return signed;
        },
      };

      const anchorProvider = getProvider(wallet as any);
      const program = createProgram(anchorProvider);
      
      const userPubkey = new PublicKey(address);
      const [globalStatePDA] = getGlobalStatePDA();
      const [vaultPDA] = getVaultPDA(globalStatePDA);
      const [focusPoolVaultPDA] = getFocusPoolVaultPDA(globalStatePDA);
      const [failurePoolVaultPDA] = getFailurePoolVaultPDA(globalStatePDA);

      console.log('Initializing global state...');
      console.log('Global State PDA:', globalStatePDA.toString());
      console.log('Authority:', userPubkey.toString());

      const tx = await (program.methods as any)
        .initialize()
        .accounts({
          globalState: globalStatePDA,
          vault: vaultPDA,
          focusPoolVault: focusPoolVaultPDA,
          failurePoolVault: failurePoolVaultPDA,
          authority: userPubkey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log('✅ Global state initialized successfully!');
      console.log('Transaction signature:', tx);
      setMessage("✅ Global state initialized successfully! Please refresh the page.");
    } catch (error: any) {
      console.error('❌ Error initializing global state:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return null;
  }

  return (
    <div style={{ 
      position: "fixed", 
      top: 20, 
      left: 20, 
      background: "rgba(0, 0, 0, 0.9)", 
      border: "1px solid #333", 
      borderRadius: 8, 
      padding: "16px 20px",
      zIndex: 1000
    }}>
      <div style={{ color: "#ccc", fontSize: 14, marginBottom: 8, fontWeight: "bold" }}>
        Initialize Global State
      </div>
      <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
        This needs to be done once before the app can work
      </div>
      <button
        onClick={initializeGlobalState}
        disabled={loading}
        style={{
          padding: "8px 16px",
          borderRadius: 6,
          border: "1px solid #14F195",
          background: loading ? "#333" : "transparent",
          color: loading ? "#666" : "#14F195",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 12,
        }}
      >
        {loading ? "Initializing..." : "Initialize"}
      </button>
      {message && (
        <div style={{ 
          marginTop: 8, 
          fontSize: 12, 
          color: message.includes("✅") ? "#14F195" : "#e00" 
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
