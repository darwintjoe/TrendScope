"use client";

import { useState, useEffect, useCallback } from "react";
import { OHLC, IndicatorResult, IndicatorParams } from "@/lib/provider/types";
import { computeAllIndicators, greenCount, redCount } from "@/lib/indicators";
import { INDICATOR_REGISTRY, IndicatorMeta } from "@/lib/indicators";
import { CandlestickChart } from "./CandlestickChart";
import { IndicatorChart, CHARTABLE_INDICATORS } from "./IndicatorChart";
import { ALL_RANGES, findRange } from "@/lib/ranges";
import { applySuffix, stripSuffix } from "@/lib/market";

const DOT_BG: Record<string, string> = {
  green: "bg-green-500/15 border-green-500/40",
  red: "bg-red-500/15 border-red-500/40",
  grey: "bg-zinc-800 border-zinc-700",
};

const VAL_CLR: Record<string, string> = {
  green: "text-green-400",
  red: "text-red-400",
  grey: "text-zinc-500",
};

const LOCAL_PARAMS_KEY = "trendscope_local_params";

interface StockDetailProps {
  ticker: string;
  market: string;
  globalParams: Record<string, IndicatorParams>;
  onClose: () => void;
}

export function StockDetail({ ticker, market, globalParams, onClose }: StockDetailProps) {
  const fullTicker = applySuffix(ticker, market);
  const displayTicker = stripSuffix(fullTicker, market);

  const [chartRange, setChartRange] = useState("1y");
  const [ohlc, setOhlc] = useState<OHLC[]>([]);
  const [indicators, setIndicators] = useState<IndicatorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chartIndicators, setChartIndicators] = useState<string[]>([]);
  const [chartHeights, setChartHeights] = useState<Record<string, number>>({});
  const [expandedBg, setExpandedBg] = useState<string | null>(null);
  const [localParams, setLocalParams] = useState<Record<string, IndicatorParams>>({});

  /* load persisted local params for this ticker */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PARAMS_KEY);
      if (saved) {
        const all = JSON.parse(saved);
        if (all[ticker]) setLocalParams(all[ticker]);
      }
    } catch { /* ignore */ }
  }, [ticker]);

  /* save local params */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_PARAMS_KEY);
      const all = saved ? JSON.parse(saved) : {};
      all[ticker] = localParams;
      localStorage.setItem(LOCAL_PARAMS_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
  }, [ticker, localParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const r = findRange(chartRange);

    try {
      const res = await fetch(
        `/api/proxy?t=${encodeURIComponent(fullTicker)}&range=${r.yahooRange}&interval=${r.yahooInterval}`
      );
      let data: OHLC[] = [];
      if (res.ok) {
        const json = await res.json();
        data = json.ohlc ?? [];
      }
      setOhlc(data);

      if (data.length >= 20) {
        setIndicators(computeAllIndicators(data, Object.keys(localParams).length > 0 ? localParams : globalParams));
      } else {
        setIndicators([]);
      }
    } catch {
      setOhlc([]);
      setIndicators([]);
    }
    setLoading(false);
  }, [fullTicker, chartRange, globalParams, localParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (ohlc.length >= 20) {
      const p = Object.keys(localParams).length > 0 ? localParams : globalParams;
      setIndicators(computeAllIndicators(ohlc, p));
    }
  }, [localParams, globalParams, ohlc]);

  const toggleChart = (name: string) => {
    setChartIndicators((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const adjustChartHeight = (name: string, delta: number) => {
    setChartHeights((prev) => {
      const current = prev[name] ?? 80;
      const next = Math.max(40, Math.min(200, current + delta));
      return { ...prev, [name]: next };
    });
  };

  const g = greenCount(indicators);
  const r = redCount(indicators);
  const last = ohlc.length > 0 ? ohlc[ohlc.length - 1] : null;
  const prev = ohlc.length > 1 ? ohlc[ohlc.length - 2] : null;
  const chgPct = last && prev && prev.close > 0
    ? ((last.close - prev.close) / prev.close) * 100
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-lg shrink-0">
            ←
          </button>
          <span className="font-bold text-sm truncate">{displayTicker}</span>
          {last && (
            <>
              <span className="text-xs text-zinc-300 tabular-nums">{last.close.toFixed(2)}</span>
              {chgPct != null && (
                <span className={`text-xs tabular-nums font-medium ${chgPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {chgPct >= 0 ? "+" : ""}{chgPct.toFixed(2)}%
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* range selector */}
        <div className="flex bg-zinc-900 mx-4 mt-3 rounded-lg p-0.5">
          {ALL_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setChartRange(r.value)}
              className={`flex-1 px-1 py-1.5 text-[10px] rounded-md transition-colors ${
                chartRange === r.value ? "bg-blue-600 text-white" : "text-zinc-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* chart */}
        <div className="px-4 pt-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-[220px] text-zinc-500 text-xs gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Loading...
            </div>
          ) : ohlc.length > 0 ? (
            <>
              <CandlestickChart key={chartRange} ohlc={ohlc} height={220} />
              {chartIndicators.map((name) => (
                <div key={name} className="relative">
                  <div className="absolute right-1 top-1 flex flex-col gap-0.5 z-10">
                    <button
                      onClick={() => adjustChartHeight(name, 20)}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 rounded text-[10px] text-zinc-400"
                    >
                      +
                    </button>
                    <button
                      onClick={() => adjustChartHeight(name, -20)}
                      className="w-5 h-5 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 rounded text-[10px] text-zinc-400"
                    >
                      −
                    </button>
                  </div>
                  <IndicatorChart name={name} ohlc={ohlc} height={chartHeights[name] ?? 80} />
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-zinc-600 text-xs">No data</div>
          )}
        </div>

        {/* score summary */}
        {indicators.length > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-4 px-3 py-2 bg-zinc-900 rounded-lg text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-400 font-bold">{g}</span>
              <span className="text-zinc-600">up</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 font-bold">{r}</span>
              <span className="text-zinc-600">down</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-zinc-400 font-bold">{indicators.length - g - r}</span>
              <span className="text-zinc-600">flat</span>
            </span>
          </div>
        )}

        {/* indicators list — clickable rows */}
        {indicators.length > 0 && (
          <div className="px-4 pt-3 space-y-1.5">
            {indicators.map((ind) => {
              const meta = INDICATOR_REGISTRY.find((m) => m.name === ind.name);
              const isExpanded = expanded === ind.name;
              const hasChart = CHARTABLE_INDICATORS.includes(ind.name);
              const chartOn = chartIndicators.includes(ind.name);
              return (
                <div key={ind.name} className={`rounded-lg border overflow-hidden ${DOT_BG[ind.color]}`}>
                  {/* main row */}
                  <div className="flex items-center">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : ind.name)}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5"
                    >
                      <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                        ind.color === "green" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" :
                        ind.color === "red" ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" :
                        "bg-zinc-500"
                      }`} />
                      <span className="text-[12px] text-zinc-200 flex-1 text-left">{ind.name}</span>
                      <span className={`text-[11px] tabular-nums font-medium ${VAL_CLR[ind.color]}`}>
                        {ind.value ?? "—"}
                      </span>
                      <span className={`text-[10px] ${VAL_CLR[ind.color]}`}>
                        {ind.color === "green" ? "▲" : ind.color === "red" ? "▼" : "—"}
                      </span>
                      <span className="text-zinc-600 text-[10px]">{isExpanded ? "▾" : "›"}</span>
                    </button>
                    {hasChart && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleChart(ind.name); }}
                        className={`px-2 py-2.5 text-[10px] shrink-0 ${chartOn ? "text-blue-400" : "text-zinc-600 hover:text-zinc-400"}`}
                        title={chartOn ? "Hide chart" : "Show chart"}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* expanded panel */}
                  {isExpanded && meta && (
                    <div className="px-3 pb-3 border-t border-zinc-700/50 pt-2 space-y-2">
                      {/* description */}
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        {meta.shortDesc}
                      </p>

                      {/* background - collapsible */}
                      <div className="space-y-1">
                        <button
                          onClick={() => setExpandedBg(expandedBg === ind.name ? null : ind.name)}
                          className="text-[9px] text-zinc-600 uppercase tracking-wider flex items-center gap-1 hover:text-zinc-400"
                        >
                          <span className={`transition-transform ${expandedBg === ind.name ? "rotate-90" : ""}`}>▶</span>
                          Background
                        </button>
                        {expandedBg === ind.name && (
                          <p className="text-[10px] text-zinc-500 leading-relaxed pl-3 border-l border-zinc-800">
                            {meta.background}
                          </p>
                        )}
                      </div>

                      {/* interpretation */}
                      <div className={`text-[10px] leading-relaxed px-2 py-1.5 rounded ${
                        ind.color === "green" ? "bg-green-500/10 text-green-300" :
                        ind.color === "red" ? "bg-red-500/10 text-red-300" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {meta.interpretation[ind.color]}
                      </div>

                      {/* params */}
                      {Object.keys(meta.defaultParams).length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Parameters</span>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {Object.entries(meta.defaultParams).map(([key, defVal]) => {
                              const current = localParams[ind.name]?.[key] ?? globalParams[ind.name]?.[key] ?? defVal;
                              return (
                                <label key={key} className="flex items-center justify-between text-[10px] text-zinc-500">
                                  <span className="truncate mr-1">{key}</span>
                                  <input
                                    type="number"
                                    value={current}
                                    onChange={(e) => {
                                      const num = Number(e.target.value);
                                      if (isNaN(num)) return;
                                      setLocalParams((prev) => ({
                                        ...prev,
                                        [ind.name]: { ...(prev[ind.name] ?? meta.defaultParams), [key]: num },
                                      }));
                                    }}
                                    className="w-14 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 text-[10px] text-right"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
