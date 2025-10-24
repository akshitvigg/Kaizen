"use client"
import React from "react"
import LandingNav from "./LandingNav"
import Bento from "../components/bento"
import SignInWithSol from "./SigninWithSol"
import Features from "./Features"
import Dashboard from "../dashboard/page"
import Footer from "./Footer"
import { useWallet } from "./wallet/WalletProvider"
export default function Hero() {
  const { address } = useWallet()

  if (address) {
    return <Dashboard />
  }

  return (
    <div className="bg-gradient-to-b from from-black via-gray-600 to-black ">
      <LandingNav />
      <section className="w-full bg-gradient-to-b from-black via-gray-600 to-black text-white px-4 py-24 md:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Badge */}

            <h1 className="mt-10 text-5xl md:text-5xl lg:text-7xl font-bold text-balance leading-tight"
              style={{ fontFamily: "Pixeloid Sans, sans-serif" }}
            >
              Reclaim Your Time,
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Earn Rewards
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl text-balance hover:text-white transition-colors duration-300"
              style={{ fontFamily: "Pixeloid Sans, sans-serif" }}
            >
              The productivity platform built on Solana. Track your tasks, and get rewarded for your
              achievements.
            </p>

            <div className="transform scale-105 hover:scale-110 transition-transform duration-300 relative">
              <SignInWithSol />
            </div>
            <div
              className="flex flex-col leading-[0.8] space-y-[var(--gap)] mt-16"
              style={{ "--gap": "-0.7em" } as React.CSSProperties}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="select-none text-4xl md:text-7xl lg:text-7xl font-bold whitespace-nowrap hover:translate-x-2 transition-transform duration-300"
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
                className="text-4xl md:text-7xl lg:text-7xl font-bold text-white whitespace-nowrap hover:translate-x-2 transition-transform duration-300"
                style={{ lineHeight: "1" }}
              >
                DEEP WORK
              </span>
            </div>
            <Features />
            <div className="mt-16">
              <Bento />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
