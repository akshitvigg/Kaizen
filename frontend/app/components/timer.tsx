"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useWallet } from "./wallet/WalletProvider";
import { lamportsToSol, MIN_STAKE_SOL } from "../../lib/program";

function formatHms(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((clamped % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  // Only accept strict hh:mm:ss format
  if (!/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return null;
  const [hStr, mStr, sStr] = trimmed.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr);
  const seconds = Number(sStr);
  if (
    [hours, minutes, seconds].some((n) => Number.isNaN(n)) ||
    hours < 0 ||
    minutes < 0 ||
    seconds < 0 ||
    minutes >= 60 ||
    seconds >= 60
  ) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

export default function Timer({
  tasks,
  sessionCompleted,
  onSolAffectingAction,
  onStatsAffectingAction,
}: {
  tasks: Array<{ id: string; title: string; done: boolean }>;
  sessionCompleted: boolean;
  onSolAffectingAction?: () => void;
  onStatsAffectingAction?: () => void;
}): React.ReactElement {
  const { address } = useWallet();
  const {
    userState,
    loading,
    error,
    startFocusSession,
    completeFocusSession,
    failFocusSession,
    claimRewards,
  } = useFocusSession();

  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>("00:30:00");
  const [inputError, setInputError] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(0.01);
  const [showStakeInput, setShowStakeInput] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeGuardRef = useRef<boolean>(false);
  const [lastSetDuration, setLastSetDuration] = useState<number>(1800); // for restoring after reward/claim/fail

  useEffect(() => {
    setEditValue(formatHms(secondsRemaining));
  }, [secondsRemaining]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
    }
  }, [secondsRemaining, isRunning]);

  // Sync with blockchain state
  useEffect(() => {
    if (userState?.isActive) {
      // Only sync timer to blockchain state if there's an active session!
      const durationSeconds = userState.durationMinutes * 60;
      const elapsedSeconds = Math.floor(Date.now() / 1000 - userState.startTime);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setSecondsRemaining(remaining);
      if (remaining > 0) {
        setIsRunning(true);
      }
    } else {
      // Don't touch the timer if no session is active!
      setIsRunning(false);
    }
  }, [userState]);

  // Handle timer completion
  useEffect(() => {
    if (secondsRemaining === 0 && isRunning && userState?.isActive && !completeGuardRef.current) {
      completeGuardRef.current = true;
      handleCompleteSession();
    }
    if (secondsRemaining > 0) {
      completeGuardRef.current = false;
    }
  }, [secondsRemaining, isRunning, userState]);

  // After session stops, restore to last set or default time
  useEffect(() => {
    if (!userState?.isActive && !isRunning) {
      setSecondsRemaining(lastSetDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState?.isActive, isRunning]);

  const handleStartSession = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (userState?.isActive) {
      alert("You already have an active session");
      return;
    }

    const localTasks = tasks?.map((t) => ({ description: t.title, completed: false })) || [];

    if (localTasks.length === 0) {
      alert("Please add at least one task before starting");
      return;
    }

    const durationMinutes = Math.ceil(secondsRemaining / 60);

    const success = await startFocusSession(stakeAmount, durationMinutes, localTasks);

    if (success) {
      setIsRunning(true);
      setShowStakeInput(false);
      onSolAffectingAction && onSolAffectingAction();
      onStatsAffectingAction && onStatsAffectingAction();
    }
  };

  const handleCompleteSession = async () => {
    if (!userState?.isActive) return;

    const success = await completeFocusSession();
    if (success) {
      alert("Session completed! Mark your tasks as done and claim your rewards.");
      setIsRunning(false);
      onSolAffectingAction && onSolAffectingAction();
      onStatsAffectingAction && onStatsAffectingAction();
    }
  };

  const handleClaimRewards = async () => {
    if (!userState) return;

    const success = await claimRewards();
    if (success) {
      alert("Rewards claimed!");
      onSolAffectingAction && onSolAffectingAction();
      onStatsAffectingAction && onStatsAffectingAction();
    }
  };

  const handleFailSession = async () => {
    if (!userState?.isActive) return;

    const confirmed = window.confirm(
      "Are you sure you want to fail this session? Your stake will be lost."
    );
    if (!confirmed) return;

    const success = await failFocusSession();
    if (success) {
      alert("Session failed. Your stake has been moved to the failure pool.");
      setIsRunning(false);
      onSolAffectingAction && onSolAffectingAction();
      onStatsAffectingAction && onStatsAffectingAction();
    }
  };

  const display = useMemo(() => formatHms(secondsRemaining), [secondsRemaining]);

  const commitEdit = () => {
    const parsed = parseTimeInput(editValue);
    if (parsed === null) {
      setInputError("Invalid format. Use hh:mm:ss");
      return;
    }
    setSecondsRemaining(parsed);
    setLastSetDuration(parsed);
    setIsEditing(false);
    setInputError(null);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditValue(formatHms(secondsRemaining));
      setIsEditing(false);
      setInputError(null);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 12 }}>

      {/* Quick Duration Buttons */}
      {/* REMOVE the PRESET_DURATIONS declaration and quick-select button block from the UI */}

      {/* Session Status */}
      {userState?.isActive && (
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #14F195",
            background: "rgba(20, 241, 149, 0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#14F195", fontWeight: "bold", marginBottom: 4 }}>
            Active Session
          </div>
          <div style={{ color: "#ccc", fontSize: 14 }}>
            Stake: {lamportsToSol(userState.stakeAmount).toFixed(4)} SOL
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #e00",
            background: "rgba(238, 0, 0, 0.1)",
            textAlign: "center",
            color: "#e00",
          }}
        >
          {error}
        </div>
      )}

      {/* Timer Display */}
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => {
              const value = e.target.value;
              setEditValue(value);
              if (value.length === 0) {
                setInputError("Invalid format. Use hh:mm:ss");
                return;
              }
              if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
                setInputError("Invalid format. Use hh:mm:ss");
                return;
              }
              const [h, m, s] = value.split(":").map(Number);
              if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s) || m >= 60 || s >= 60) {
                setInputError("Invalid format. Use hh:mm:ss");
                return;
              }
              setInputError(null);
            }}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            aria-label="Edit timer (hh:mm:ss)"
            aria-invalid={inputError ? true : false}
            style={{
              fontVariantNumeric: "tabular-nums",
              fontFamily: "inherit",
              fontSize: 120,
              width: 600,
              textAlign: "center",
              padding: "6px 16px",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!userState?.isActive) {
                setIsEditing(true);
                setInputError(null);
              }
            }}
            aria-label="Edit timer"
            title={userState?.isActive ? "Cannot edit during active session" : "Click to edit time"}
            disabled={userState?.isActive}
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: 120,
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: userState?.isActive ? "not-allowed" : "text",
              width: 600,
              opacity: userState?.isActive ? 0.7 : 1,
            }}
          >
            {display}
          </button>
        )}
      </div>
      {isEditing && inputError && (
        <span style={{ color: "#e00", fontSize: 13, textAlign: "center" }}> {inputError}</span>
      )}
      <small style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
        {userState?.isActive ? "Session in progress" : "Click the time to edit (hh:mm:ss)"}
      </small>

      {/* Stake Input */}
      {!userState?.isActive && !isRunning && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {!showStakeInput ? (
            <button
              type="button"
              onClick={() => setShowStakeInput(true)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #14F195",
                background: "transparent",
                color: "#14F195",
                cursor: "pointer",
              }}
            >
              Set Stake Amount
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
                  min={MIN_STAKE_SOL}
                  step="0.001"
                  placeholder="0.01"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #555",
                    background: "transparent",
                    color: "#ddd",
                    width: 120,
                    textAlign: "center",
                  }}
                />
                <span style={{ color: "#ccc" }}>SOL</span>
              </div>
              <small style={{ color: "#666", fontSize: 12, textAlign: "center" }}>
                Minimum: {MIN_STAKE_SOL} SOL
              </small>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 4 }}>
        {!userState ? (
          <>
            <button
              type="button"
              onClick={handleStartSession}
              disabled={loading || !address || stakeAmount < MIN_STAKE_SOL}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #14F195",
                background: loading ? "#333" : "#14F195",
                color: loading ? "#666" : "#000",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Starting..." : "Start Focus Session"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setSecondsRemaining(0);
                setShowStakeInput(false);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #ffffff",
                background: "#000000",
                color: "#ffffff",
              }}
            >
              Reset
            </button>
          </>
        ) : userState.isActive ? (
          <>
            <button
              type="button"
              onClick={handleCompleteSession}
              disabled={loading || secondsRemaining > 0}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #14F195",
                background: loading ? "#333" : "#14F195",
                color: loading ? "#666" : "#000",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Completing..." : "Complete Session"}
            </button>

            <button
              type="button"
              onClick={handleFailSession}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #e00",
                background: "transparent",
                color: "#e00",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Failing..." : "Fail Session"}
            </button>
          </>
        ) : sessionCompleted ? (
          <>
            <button
              type="button"
              onClick={handleClaimRewards}
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #14F195",
                background: loading ? "#333" : "#14F195",
                color: loading ? "#666" : "#000",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Claiming..." : "Claim Rewards"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleStartSession}
              disabled={loading || !address || stakeAmount < MIN_STAKE_SOL}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #14F195",
                background: loading ? "#333" : "#14F195",
                color: loading ? "#666" : "#000",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Starting..." : "Start New Session"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}


