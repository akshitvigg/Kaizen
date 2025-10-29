"use client"

import { Zap, Lock, Coins, BarChart3, Workflow, Shield } from "lucide-react"

export default function BentoSection() {
  return (
    <section className="w-full text-white px-4 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 md:mb-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Powered by Solana
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {/* Large Feature - Spans 2 columns */}
          <div className="md:col-span-2 md:row-span-2 border border-white/20 rounded-xl p-8 md:p-12 bg-gradient-to-br from-white/5 to-transparent hover:border-white/40 transition-all duration-300 hover:shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <Zap className="w-10 h-10 md:w-12 md:h-12 text-white flex-shrink-0" />
                <div className="text-right">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">Build on Solana</h3>
                  <p className="text-gray-400 text-sm md:text-base">Build on solana for fast staking and low fees</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 border border-white/20 rounded-xl p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent hover:border-white/40 transition-all duration-300 hover:shadow-lg">
            <Coins className="w-8 h-8 mb-4 text-white" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-sm text-gray-400">Maximize productivity with token-based incentives</p>
          </div>

          <div className="md:col-span-1 border border-white/20 rounded-xl p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent hover:border-white/40 transition-all duration-300 hover:shadow-lg">
            <Shield className="w-8 h-8 mb-4 text-white" />
            <h3 className="text-xl md:text-2xl font-bold mb-2">Decentralized</h3>
            <p className="text-sm text-gray-400">Own your data with full control and privacy</p>
          </div>

          {/* Wide Feature - Spans 2 columns */}
          <div className="md:col-span-2 border border-white/20 rounded-xl p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent hover:border-white/40 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8 text-white flex-shrink-0" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">Real-time Analytics</h3>
                <p className="text-sm text-gray-400">Monitor your progress with instant insights and metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
