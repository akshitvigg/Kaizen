"use client";

import { NavbarWalletButton } from "./layout/NavbarWalletButton";
import React from "react";

export default function Navbar(): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + Brand */}
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <a
              href="#leaderboards"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-3"
            >
              Leaderboards
            </a>
          </nav>

          {/* Right Side: Stake + Wallet */}
          <div className="flex items-center gap-4">
            {/* SOL Stake Placeholder */}
            <div
              aria-label="SOL at stake"
              title="SOL at stake"
              className="hidden sm:block min-w-16 h-8 border border-white/30 rounded-md bg-transparent"
            />

            {/* Wallet Button */}
            <div className="flex items-center">
              <NavbarWalletButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Optional - add later if needed) */}
    </header>
  );
}
