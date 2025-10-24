import React from "react"

export default function features() {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-white">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">Gamify Your Life</h1>
      <p className="max-w-2xl text-center text-base md:text-lg mb-8 leading-relaxed">
        DeepWork turns your real life into a game. Build habits, crush goals, and level up —
        with real stakes and real rewards. Stake SOL on your consistency. Win when you show up. Lose when you don’t.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Card 1: Earn Rewards */}
        <div className="flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold mb-2">Earn Real SOL</h3>
          <p className="text-sm text-gray-300">
            Stake SOL on your goals. Check off tasks daily and watch your wallet grow.
            Consistency pays — literally.
          </p>
        </div>

        <div className="flex flex-col items-center text-center bg-white/5 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-white/10">
          <h3 className="text-2xl font-bold mb-2">Track Everything</h3>
          <p className="text-sm text-gray-300">
            One dashboard for your habits, daily goals, and to-do list.
            See streaks, stats, and progress — all in one place.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold mb-2">Compete with Friends</h3>
          <p className="text-sm text-gray-300">
            Challenge friends to habit battles. Leaderboards, bragging rights, and shared stakes.
            Who will stay consistent the longest?
          </p>
        </div>
      </div>
    </div>


  )
}
