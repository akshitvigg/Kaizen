"use client";

import React, { useState, useEffect } from "react";
import { useFocusSession } from "../../hooks/useFocusSession";

type Todo = { id: string; title: string; done: boolean };

export default function TodoList({
  onTasksChange,
  sessionCompleted
}: {
  onTasksChange?: (tasks: Todo[]) => void,
  sessionCompleted?: boolean
}): React.ReactElement {
  const { userState, updateTask, loading } = useFocusSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState<string>("");

  // Load tasks from on-chain state if available
  useEffect(() => {
    if (userState?.tasks && userState.tasks.length > 0) {
      setTodos(userState.tasks.map((t, idx) => ({
        id: idx.toString(),
        title: t.description,
        done: t.completed,
      })));
    } else if (!userState) {
      // Reset when there's no user state
      setTodos([]);
    }
  }, [userState]);

  // Notify parent of task changes
  useEffect(() => {
    if (onTasksChange && todos.length > 0) {
      onTasksChange(todos);
    }
  }, [todos, onTasksChange]);

  const addTodo = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), title: trimmed, done: false },
    ]);
    setTitle("");
  };

  const toggleTodo = async (id: string) => {
    if (sessionCompleted && userState) {
      // If session is completed, update on-chain
      const taskIndex = parseInt(id);
      const currentTask = todos.find(t => t.id === id);
      if (currentTask && !isNaN(taskIndex)) {
        const newCompleted = !currentTask.done;
        await updateTask(taskIndex, newCompleted);
      }
    } else {
      // Otherwise, just update local state
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    }
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Read-only only if session is active (can't edit tasks during active session)
  const isReadOnly = userState?.isActive === true;

  const displayTitle = sessionCompleted
    ? "Mark tasks as complete, then claim rewards"
    : userState?.isActive
      ? "Session in progress"
      : "Add tasks for your session";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, width: 360 }}>
      <div style={{ color: "#ccc", fontSize: 14, fontWeight: "bold" }}>{displayTitle}</div>
      {!isReadOnly && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTodo();
            }}
            placeholder="New task"
            style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #555", background: "transparent", color: "#ddd" }}
          />
          <button type="button" onClick={addTodo} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #888", background: "transparent", color: "#ddd" }}>
            +
          </button>
        </div>
      )}

      <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
        {todos.map((t) => (
          <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              onClick={() => toggleTodo(t.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "1px solid #888",
                background: t.done ? "#14F195" : "transparent",
                color: "#000",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              {t.done ? "✓" : ""}
            </button>
            <span style={{ color: "#ddd", textDecoration: t.done ? "line-through" : "none", flex: 1 }}>{t.title}</span>
            {!isReadOnly && (
              <button type="button" onClick={() => removeTodo(t.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #888", background: "transparent", color: "#ddd" }}>
                -
              </button>
            )}
          </li>
        ))}
      </ul>
      {sessionCompleted && userState && (
        <div style={{
          padding: "8px 12px",
          borderRadius: 6,
          background: "rgba(20, 241, 149, 0.1)",
          border: "1px solid #14F195",
          fontSize: 12,
          color: "#14F195"
        }}>
          Completed: {todos.filter(t => t.done).length} / {todos.length} tasks
        </div>
      )}
    </section>
  );
}


