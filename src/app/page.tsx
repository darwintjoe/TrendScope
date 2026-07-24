"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TickerInput } from "@/components/TickerInput";
import { TickerTable } from "@/components/TickerTable";
import { IndicatorSettings } from "@/components/IndicatorSettings";
import { StockDetail } from "@/components/StockDetail";
import { LandingPage } from "@/components/LandingPage";
import { TickerScore, IndicatorParams, OHLC } from "@/lib/provider/types";
import { computeAllIndicators, greenCount, redCount } from "@/lib/indicators";
import { sortByTrend } from "@/lib/sort";
import { applySuffix, stripSuffix, getMarket } from "@/lib/market";
import { getDefaultTickers } from "@/lib/seedTopTen";
import { getCachedScore, setCachedScore } from "@/lib/cache";
import { ALL_RANGES, findRange } from "@/lib/ranges";

const MAX_TICKERS = 10;
const STORAGE_KEY = "trendscope_watchlist";
const MARKET_KEY = "trendscope_market";
const PULL_THRESHOLD = 60;

export default function Home() {
  const [market, setMarket] = useState("ID");
  const [tickers, setTickers] = useState<string[]>([]);
  const [scores, setScores] = useState<TickerScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("1y");
  const [params, setParams] = useState<Record<string, IndicatorParams>>({});
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  /* pull-to-refresh state */
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPulling = useRef(false);

  /* load persisted market + watchlist */
  useEffect(() => {
    try {
      const savedMarket = localStorage.getItem(MARKET_KEY);
      if (savedMarket) setMarket(savedMarket);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.market && savedMarket) setMarket(savedMarket);
        if (data.tickers?.length) setTickers(data.tickers);
      }
    } catch { /* ignore */ }
  }, []);

  /* save watchlist (not market — saved separately on agree) */
  useEffect(() => {
    if (!agreed) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ market, tickers }));
    } catch { /* ignore */ }
  }, [market, tickers, agreed]);

  useEffect(() => {
    if (tickers.length === 0 && agreed) {
      setTickers(getDefaultTickers(market));
    }
  }, [market, tickers.length, agreed]);

  const computeAll = useCallback(async (skipCache = false) => {
    setLoading(true);
    const results: TickerScore[] = [];
    const r = findRange(range);

    for (const rawTicker of tickers) {
      const fullTicker = applySuffix(rawTicker, market);
      const displayTicker = stripSuffix(fullTicker, market);

      if (!skipCache) {
        const cached = getCachedScore<TickerScore>(fullTicker, range);
        if (cached) {
          results.push(cached);
          continue;
        }
      }

      try {
        const res = await fetch(
          `/api/proxy?t=${encodeURIComponent(fullTicker)}&range=${r.yahooRange}&interval=${r.yahooInterval}`
        );
        let ohlc: OHLC[] = [];
        if (res.ok) {
          const data = await res.json();
          ohlc = data.ohlc ?? [];
        }

        if (ohlc.length < 10) {
          results.push({ ticker: displayTicker, indicators: [], greenCount: 0, redCount: 0 });
          continue;
        }

        const indicators = computeAllIndicators(ohlc, params);
        const last = ohlc[ohlc.length - 1];
        const prev = ohlc[ohlc.length - 2];

        const score: TickerScore = {
          ticker: displayTicker,
          price: last.close,
          change: last.close - prev.close,
          changePct: prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0,
          indicators,
          greenCount: greenCount(indicators),
          redCount: redCount(indicators),
        };

        setCachedScore(fullTicker, range, score);
        results.push(score);
      } catch {
        results.push({ ticker: displayTicker, indicators: [], greenCount: 0, redCount: 0 });
      }
    }

    setScores(sortByTrend(results));
    setLoading(false);
  }, [tickers, market, range, params]);

  useEffect(() => {
    if (tickers.length > 0 && agreed) computeAll();
  }, [computeAll, tickers, agreed]);

  /* pull-to-refresh handlers */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD * 1.5));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      computeAll(true).then(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, computeAll]);

  const addTicker = (t: string) => {
    if (tickers.length >= MAX_TICKERS) return;
    if (tickers.some((x) => x.toUpperCase() === t)) return;
    setTickers([...tickers, t]);
  };

  const removeTicker = (t: string) => {
    setTickers(tickers.filter((x) => x !== t));
  };

  const totalGreen = scores.reduce((s, x) => s + x.greenCount, 0);
  const totalRed = scores.reduce((s, x) => s + x.redCount, 0);

  /* landing page — every session (must be after all hooks) */
  if (!agreed) {
    return (
      <LandingPage
        initialMarket={market}
        onAgree={(m) => {
          localStorage.setItem(MARKET_KEY, m);
          setMarket(m);
          setTickers(getDefaultTickers(m));
          setAgreed(true);
        }}
      />
    );
  }

  const marketInfo = getMarket(market);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* header */}
      <header className="border-b border-zinc-800 px-4 py-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight">TrendScope</h1>
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {marketInfo?.flag} {marketInfo?.name}
            </span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">
              {scores.length}
            </span>
          </div>
        </div>

        {/* range row */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 rounded-lg p-0.5 flex-1 overflow-x-auto">
            {ALL_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap ${
                  range === r.value
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* add ticker row */}
        <div className="flex items-center gap-2">
          <TickerInput onAdd={addTicker} maxReached={tickers.length >= MAX_TICKERS} />
        </div>
      </header>

      {/* pull-to-refresh area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* pull indicator */}
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 40 : pullDistance }}
        >
          {isRefreshing ? (
            <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : pullDistance >= PULL_THRESHOLD ? (
            <span className="text-[11px] text-blue-400">Release to refresh</span>
          ) : pullDistance > 0 ? (
            <span className="text-[11px] text-zinc-500">Pull down to refresh</span>
          ) : null}
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* summary bar */}
          {scores.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-400 font-semibold">{totalGreen}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-semibold">{totalRed}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="text-zinc-500">
                  {scores.length * 10 - totalGreen - totalRed}
                </span>
              </span>
            </div>
          )}

          {/* indicator legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-600">
            <span>MACD</span>
            <span>RSI</span>
            <span>Stoch</span>
            <span>Vol</span>
            <span>Frac</span>
            <span>ZZ</span>
            <span>EMA</span>
            <span>Freq</span>
            <span>Alli</span>
            <span>CMF</span>
          </div>

          {/* settings */}
          <IndicatorSettings params={params} onChange={(name, p) => setParams({ ...params, [name]: p })} />

          {/* stock cards */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <TickerTable
              scores={scores}
              loading={loading}
              onRemove={removeTicker}
              onSelect={(t) => setSelectedTicker(t)}
            />
          </div>

          {/* footer */}
          <div className="text-center text-[10px] text-zinc-700 py-3">
            Pull down to refresh · Tap ticker for chart & details
          </div>
        </div>
      </div>

      {/* detail modal */}
      {selectedTicker && (
        <StockDetail
          ticker={selectedTicker}
          market={market}
          globalParams={params}
          onClose={() => setSelectedTicker(null)}
        />
      )}
    </div>
  );
}
