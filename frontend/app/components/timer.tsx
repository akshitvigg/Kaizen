"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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

export default function Timer(): React.ReactElement {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>("00:30:00");
  const [inputError, setInputError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const display = useMemo(() => formatHms(secondsRemaining), [secondsRemaining]);

  const commitEdit = () => {
    const parsed = parseTimeInput(editValue);
    if (parsed === null) {
      setInputError("Invalid format. Use hh:mm:ss");
      // Keep editing to allow user to correct the value
      return;
    }
    setSecondsRemaining(parsed);
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
              setIsEditing(true);
              setInputError(null);
            }}
            aria-label="Edit timer"
            title="Click to edit time"
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: 120,
              padding: "6px 16px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "text",
              width: 600,
            }}
          >
            {display}
          </button>
        )}
      </div>
      {isEditing && inputError && (
        <span style={{ color: "#e00", fontSize: 13, textAlign: "center" }}> {inputError}</span>
      )}
      <small style={{ color: "#666", fontSize: 14, textAlign: "center" }}>Click the time to edit (hh:mm:ss)</small>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setIsRunning((r) => !r)}
          disabled={secondsRemaining === 0 && !isRunning}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #ffffff",
            background: "#000000",
            color: "#ffffff",
          }}
        >
          {isRunning ? "Pause" : "Start timer"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSecondsRemaining(0);
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
      </div>
    </div>
  );
}


