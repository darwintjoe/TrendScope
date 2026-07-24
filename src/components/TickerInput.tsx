"use client";

import { useState } from "react";

interface TickerInputProps {
  onAdd: (ticker: string) => void;
  maxReached: boolean;
}

export function TickerInput({ onAdd, maxReached }: TickerInputProps) {
  const [val, setVal] = useState("");

  const submit = () => {
    const t = val.trim().toUpperCase();
    if (!t) return;
    onAdd(t);
    setVal("");
  };

  return (
    <div className="flex gap-1.5 flex-1">
      <input
        type="text"
        id="ticker-input"
        name="ticker"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={maxReached ? "Max 10" : "Add ticker..."}
        disabled={maxReached}
        autoComplete="off"
        className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-lg px-2.5 py-1.5 flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={maxReached || !val.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors shrink-0"
      >
        +
      </button>
    </div>
  );
}
