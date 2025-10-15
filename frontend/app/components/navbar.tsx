"use client";

import React from "react";

export default function Navbar(): React.ReactElement {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid #333",
      }}
    >
      <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a href="#" style={{ color: "#ccc", textDecoration: "none", fontSize: 18 }}>
          leaderboards
        </a>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Empty SOL-at-stake pill */}
        <div
          aria-label="SOL at stake"
          title="SOL at stake"
          style={{
            minWidth: 64,
            height: 28,
            borderRadius: 999,
            border: "1px solid #888",
            background: "transparent",
          }}
        />

        {/* Profile circle */}
        <button
          type="button"
          aria-label="Profile"
          title="Profile"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "1px solid #888",
            background: "transparent",
          }}
        />
      </div>
    </header>
  );
}


