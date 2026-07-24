"use client";

import { MARKETS } from "@/lib/market";

interface MarketSelectProps {
  value: string;
  onChange: (code: string) => void;
}

export function MarketSelect({ value, onChange }: MarketSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
    >
      {MARKETS.map((m) => (
        <option key={m.code} value={m.code}>
          {m.flag} {m.name}
        </option>
      ))}
    </select>
  );
}
