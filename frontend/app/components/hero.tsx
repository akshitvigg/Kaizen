"use client"
import React from "react"
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
    <section className="w-full bg-black text-white px-4 py-24 md:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}

          <h1 className="text-7xl md:text-7xl lg:text-8xl font-bold text-balance leading-tight"
            style={{ fontFamily: "Pixeloid Sans, sans-serif" }}
          >
            Reclaim Your Time,
            <br />
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Earn Rewards
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl text-balance "
            style={{ fontFamily: "Pixeloid Sans, sans-serif" }}
          >
            The productivity platform built on Solana. Track your tasks, and get rewarded for your
            achievements.
          </p>

          <div className="transform scale-105 ">
            <SignInWithSol />
          </div>

          <div
            className="flex flex-col leading-[0.8] space-y-[var(--gap)] mt-16"
            style={{ "--gap": "-0.7em" } as React.CSSProperties}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className="select-none text-6xl md:text-7xl lg:text-8xl font-bold whitespace-nowrap"
                style={{
                  WebkitTextStroke: "1px white",
                  color: "black",
                  lineHeight: "1",
                }}
              >
                DEEP WORK
              </span>
            ))}
            <span
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white whitespace-nowrap"
              style={{ lineHeight: "1" }}
            >
              DEEP WORK
            </span>
          </div>
          <div className="flex flex-col items-center" >
            <p className="text-3xl font-bold text-white"> What is DEEPWORK?</p>
            <p className="text-white">DeepWork is a habit-building and productivity app that treats your real life like a game.</p>
            <p className="text-white">Stake Sol and earn or loose based on your performance. DeepWork is designed to motivate you to work harder</p>

            <p className="pt-10 text-3xl text-white font-bold">Earn Rewards for Your Goals</p>
          </div>

          <div className="mt-16">
            <Bento />
          </div>
        </div>
      </div>
    </section>
  )
}
