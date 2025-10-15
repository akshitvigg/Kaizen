"use client";

import React, { useState } from "react";

type Todo = { id: string; title: string; done: boolean };

export default function TodoList(): React.ReactElement {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState<string>("");

  const addTodo = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), title: trimmed, done: false },
    ]);
    setTitle("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, width: 360 }}>
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

      <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
        {todos.map((t) => (
          <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#ddd", flex: 1 }}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
              <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
            </label>
            <button type="button" onClick={() => removeTodo(t.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #888", background: "transparent", color: "#ddd" }}>
              -
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}


