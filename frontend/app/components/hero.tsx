"use client"

import type React from "react"
import Bento from "../components/bento"
import SignInWithSol from "./SigninWithSol"
import Dashboard from "../dashboard/page"
import { useWallet } from "./wallet/WalletProvider"

export default function Hero() {
  const { address } = useWallet()

  if (address) {
    return <Dashboard />
  }
  return (
    <div className="bg-black flex items-center justify-center overflow-hidden px-4">
      <div className="flex flex-col items-center space-y-8">
        {/* Layered text effect */}
        <div
          className="flex flex-col leading-[0.8] space-y-[var(--gap)]"
          style={{ "--gap": "-0.7em" } as React.CSSProperties}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="select-none text-8xl font-bold whitespace-nowrap"
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
            className="text-8xl font-bold text-white whitespace-nowrap"
            style={{ lineHeight: "1" }}
          >
            EARN BACK YOUR TIME
          </span>
        </div>
        <div className="flex justify-center">
          <SignInWithSol />
        </div>
        <div>
          <Bento />
        </div>
      </div>
    </div>
  )
}
