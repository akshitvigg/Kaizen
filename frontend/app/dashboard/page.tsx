"use client";

import React, { useState, useCallback } from "react";
import Navbar from "../components/navbar"
import Timer from "../components/timer";
import TodoList from "../components/todo";
import InitializeButton from "../components/InitializeButton";
import { useFocusSession } from "../../hooks/useFocusSession";
import { lamportsToSol } from "../../lib/program";

export default function Dashboard(): React.ReactElement {
  const { globalState, userState } = useFocusSession();
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [tasks, setTasks] = useState<Array<{ id: string, title: string, done: boolean }>>([]);

  const handleTasksChange = useCallback((t: Array<{ id: string, title: string, done: boolean }>) => {
    setTasks(t);
  }, []);

  // Check if session is completed
  React.useEffect(() => {
    if (userState && !userState.isActive) {
      setSessionCompleted(true);
    } else {
      setSessionCompleted(false);
    }
  }, [userState]);

  return (
    <div className="min-h-screen"
      style={{ minHeight: "100vh", height: "100vh", background: "#0d0d0d", color: "#eee" }}>
      <Navbar />
      <InitializeButton />
      <div style={{ position: "relative", height: "calc(100% - 61px)", width: "100%" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <Timer tasks={tasks} sessionCompleted={sessionCompleted} />
        </div>
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
            <TodoList onTasksChange={handleTasksChange} sessionCompleted={sessionCompleted} />
          </div>
        </div>

        {/* Global Stats */}
        {globalState && (
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(0, 0, 0, 0.8)",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "16px 20px",
              minWidth: 200,
            }}
          >
            <div style={{ color: "#ccc", fontSize: 14, marginBottom: 8, fontWeight: "bold" }}>
              Pool Stats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#888" }}>Focus Pool:</span>
                <span style={{ color: "#14F195" }}>{lamportsToSol(globalState.focusPool).toFixed(4)} SOL</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#888" }}>Failure Pool:</span>
                <span style={{ color: "#e00" }}>{lamportsToSol(globalState.failurePool).toFixed(4)} SOL</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#888" }}>Total Sessions:</span>
                <span style={{ color: "#ccc" }}>{globalState.totalSessions}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


