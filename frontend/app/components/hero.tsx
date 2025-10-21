"use client"

import type React from "react"
import SignInWithSol from "./SigninWithSol"
import Dashboard from "../dashboard/page"
import { useWallet } from "./wallet/WalletProvider"

export default function Hero() {
  const { address } = useWallet()

  // If wallet is connected, render Dashboard only
  if (address) {
    return <Dashboard />
  }

  // Otherwise, render Hero with SignInWithSol positioned as requested
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden px-4">
      <div className="flex flex-col items-center space-y-8">
        {/* Layered text effect */}
        <div
          className="flex flex-col leading-[0.8] space-y-[var(--gap)]"
          style={{ "--gap": "-0.7em" } as React.CSSProperties}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="select-none text-6xl font-bold whitespace-nowrap"
              style={{
                WebkitTextStroke: "1px white",
                color: "black",
                lineHeight: "1",
              }}
            >
              EARN BACK YOUR TIME
            </span>
          ))}
          <span
            className="text-6xl font-bold text-white whitespace-nowrap"
            style={{ lineHeight: "1" }}
          >
            EARN BACK YOUR TIME
          </span>
        </div>
        {/* SignInWithSol centered below the text */}
        <div className="flex justify-center">
          <SignInWithSol />
        </div>
      </div>
    </div>
  )
}
