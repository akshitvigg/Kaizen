"use client";

import React from "react";
import Navbar from "../components/navbar";
import Timer from "../components/timer";
import TodoList from "../components/todo";

export default function Dashboard(): React.ReactElement {
  return (
    <div style={{ minHeight: "100vh", height: "100vh", background: "#0d0d0d", color: "#eee" }}>
      <Navbar />
      <div style={{ position: "relative", height: "calc(100% - 61px)", width: "100%" }}>
        {/* Absolutely centered timer */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Timer />
        </div>

        {/* Todos directly below the timer */}
        <div
          style={{
            position: "absolute",
            top: "calc(50% + 180px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ width: 360 }}>
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  );
}


