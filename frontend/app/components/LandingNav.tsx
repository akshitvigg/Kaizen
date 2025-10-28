"use client";

import { useWallet } from "./wallet/WalletProvider";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { address, connect, disconnect, connecting } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    await connect();
    setIsOpen(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm">
              <span
                className="text-black font-bold text-base leading-none"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                改善
              </span>
            </div>
            <span className="hidden sm:inline text-white font-bold text-lg tracking-tight">
              Kaizen
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            <a
              href="#features"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-4"
            >
              Features
            </a>
          </div>

          {/* Desktop Wallet */}
          <div className="hidden md:flex items-center gap-4">
            {address ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm font-mono">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-6 py-2 text-white font-medium rounded-lg border border-white/20 hover:bg-white/10 transition-all disabled:opacity-50 text-sm"
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
          <div className="px-4 py-5 space-y-5">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block text-gray-300 hover:text-white transition-colors text-base"
            >
              Features
            </a>

            <div className="pt-4 border-t border-white/10 space-y-4">
              {address ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm font-mono">
                    {address.slice(0, 6)}...{address.slice(-6)}
                  </p>
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2 text-sm text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full px-4 py-2 text-black font-medium rounded-lg bg-white hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                >
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
