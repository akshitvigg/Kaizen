"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type WalletContextValue = {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshAddress: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Helper to get address from window.solana (Phantom)
  const getAddressFromProvider = async (): Promise<string | null> => {
    try {
      const anyWindow: any = window;
      const provider = anyWindow?.solana;
      if (!provider || !provider.isPhantom) return null;
      // If connected the provider.publicKey will be available
      const pub = provider.publicKey;
      if (pub) return pub.toString();
      // else try request accounts
      const resp = await provider.connect({ onlyIfTrusted: true }).catch(() => null);
      if (resp?.publicKey) return resp.publicKey.toString();
      return null;
    } catch (e) {
      console.error("getAddressFromProvider error", e);
      return null;
    }
  };

  const refreshAddress = async () => {
    if (typeof window === "undefined") return;
    const addr = await getAddressFromProvider();
    setAddress(addr);
  };

  // connect action called from signin page or UI
  const connect = async () => {
    try {
      setConnecting(true);
      const anyWindow: any = window;
      const provider = anyWindow?.solana;
      if (!provider) {
        throw new Error("No Solana provider found (e.g. Phantom).");
      }
      const resp = await provider.connect();
      const addr = resp?.publicKey?.toString();
      setAddress(addr || null);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const anyWindow: any = window;
      const provider = anyWindow?.solana;
      if (provider?.disconnect) {
        try {
          await provider.disconnect();
        } catch (e) {
          // some providers may throw if not connected — ignore
        }
      }
    } finally {
      setAddress(null);
    }
  };

  // Listen for changes from the wallet (connect/disconnect/account changed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const anyWindow: any = window;
    const provider = anyWindow?.solana;
    if (!provider) return;

    const handleConnect = (publicKey: any) => {
      setAddress(publicKey?.toString?.() ?? null);
    };
    const handleDisconnect = () => setAddress(null);

    // Some wallets emit 'connect' with no args; Phantom emits publicKey property on provider
    try {
      provider.on?.("connect", handleConnect);
      provider.on?.("disconnect", handleDisconnect);
      provider.on?.("accountChanged", (pk: any) =>
        setAddress(pk?.toString?.() ?? null)
      );
    } catch (e) {
      // ignore if provider doesn't support events
    }

    // initial check: maybe already connected
    getAddressFromProvider().then((addr) => setAddress(addr));

    return () => {
      try {
        provider.removeListener?.("connect", handleConnect);
        provider.removeListener?.("disconnect", handleDisconnect);
      } catch (e) { }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        connecting,
        connect,
        disconnect,
        refreshAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
