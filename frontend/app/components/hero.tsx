"use client"

import type React from "react"

export default function SandboxPage() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden px-4">
      <div
        className="flex flex-col leading-[0.8] space-y-[var(--gap)]"
        style={{ "--gap": "-0.7em" } as React.CSSProperties}
      >
        {/* Create layered text effect with multiple stroked spans */}
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
        <span className="text-6xl font-bold text-white whitespace-nowrap" style={{ lineHeight: "1" }}>
          EARN BACK YOUR TIME
        </span>
      </div>
    </div>
  )
}

