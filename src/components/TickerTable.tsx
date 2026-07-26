"use client";

import { useState } from "react";
import { TickerScore, IndicatorResult } from "@/lib/provider/types";
import { INDICATOR_GROUPS, computeGroupResults } from "@/lib/indicators/groups";
import { IndicatorDot } from "./IndicatorDot";

const GROUP_DOT_CLASSES: Record<string, string> = {
  green: "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]",
  red: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]",
  grey: "bg-zinc-500",
};

const GROUP_DOT_LABELS: Record<string, string> = {
  "Market Filter": "MF",
  Trend: "TR",
  "Money Flow": "MF",
  Volatility: "V",
};

interface TickerTableProps {
  scores: TickerScore[];
  loading: boolean;
  onRemove: (ticker: string) => void;
  onSelect: (ticker: string) => void;
}

export function TickerTable({ scores, loading, onRemove, onSelect }: TickerTableProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  if (loading && scores.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
        <svg className="animate-spin h-4 w-4 mr-2 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Loading...
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 text-sm">
        Add tickers or use default top-10.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {scores.map((s, idx) => {
        const greenN = s.greenCount;
        const redN = s.redCount;
        const groupResults = computeGroupResults(s.indicators);

        return (
          <div
            key={s.ticker}
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 last:border-b-0 active:bg-zinc-800/40 transition-colors"
          >
            {/* rank */}
            <span className="text-zinc-600 text-xs w-5 text-right shrink-0">
              {idx + 1}
            </span>

            {/* ticker + price block */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <button
                  onClick={() => onSelect(s.ticker)}
                  className="font-semibold text-sm text-blue-400 hover:text-blue-300 truncate text-left shrink-0"
                >
                  {s.ticker}
                </button>
                <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                  {s.price != null ? s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                </span>
                <span
                  className={`text-xs tabular-nums font-medium shrink-0 ${
                    (s.changePct ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {s.changePct != null
                    ? `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%`
                    : ""}
                </span>
              </div>
              {s.name && (
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{s.name}</div>
              )}

              {/* group dots row */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {groupResults.map(({ group, color, children }) => {
                  const isExpanded = expandedGroup === `${s.ticker}-${group.name}`;
                  return (
                    <div key={group.name} className="relative">
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : `${s.ticker}-${group.name}`)}
                        className="flex items-center gap-0.5"
                        title={`${group.name}: ${color}`}
                      >
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${GROUP_DOT_CLASSES[color]}`}
                        />
                        <span className="text-[8px] text-zinc-600">{GROUP_DOT_LABELS[group.name]}</span>
                      </button>
                      {/* expanded child dots */}
                      {isExpanded && (
                        <div className="absolute top-0 left-full ml-1 flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 z-10">
                          {children.map((child) => (
                            <IndicatorDot key={child.name} indicator={child} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* score */}
            <div className="flex items-center gap-0.5 text-xs shrink-0 tabular-nums">
              <span className="text-green-400 font-bold">{greenN}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400 font-bold">{redN}</span>
            </div>

            {/* remove */}
            <button
              onClick={() => onRemove(s.ticker)}
              className="text-zinc-700 hover:text-red-400 text-xs shrink-0 pl-1"
              title="Remove"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
