"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TickerInput } from "@/components/TickerInput";
import { TickerTable } from "@/components/TickerTable";
import { StockDetail } from "@/components/StockDetail";
import { LandingPage } from "@/components/LandingPage";
import { TickerScore, IndicatorParams, OHLC, CompanyInfo } from "@/lib/provider/types";
import { computeAllIndicators, greenCount, redCount } from "@/lib/indicators";
import { sortByTrend } from "@/lib/sort";
import { applySuffix, stripSuffix, getMarket } from "@/lib/market";
import { getDefaultTickers } from "@/lib/seedTopTen";
import { getCachedScore, setCachedScore } from "@/lib/cache";
import { ALL_RANGES, findRange } from "@/lib/ranges";

const MAX_TICKERS = 10;
const WATCHLIST_PREFIX = "trendscope_watchlist_";
const MARKET_KEY = "trendscope_market";
const AGREED_KEY = "trendscope_agreed";
const PARAMS_KEY = "trendscope_params";
const PULL_THRESHOLD = 60;

function getWatchlistKey(market: string): string {
  return WATCHLIST_PREFIX + market;
}

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

  /* load persisted market + watchlist + agreed */
  useEffect(() => {
    try {
      const savedMarket = localStorage.getItem(MARKET_KEY);
      if (savedMarket) setMarket(savedMarket);

      const marketToLoad = savedMarket || "ID";
      const savedWatchlist = localStorage.getItem(getWatchlistKey(marketToLoad));
      if (savedWatchlist) {
        const data = JSON.parse(savedWatchlist);
        if (data.tickers?.length) setTickers(data.tickers);
      }

      const savedAgreed = localStorage.getItem(AGREED_KEY);
      if (savedAgreed === "true") setAgreed(true);

      const savedParams = localStorage.getItem(PARAMS_KEY);
      if (savedParams) setParams(JSON.parse(savedParams));
    } catch { /* ignore */ }
  }, []);

  /* save watchlist per market */
  useEffect(() => {
    if (!agreed) return;
    try {
      localStorage.setItem(getWatchlistKey(market), JSON.stringify({ tickers }));
    } catch { /* ignore */ }
  }, [market, tickers, agreed]);

  /* save indicator params */
  useEffect(() => {
    if (!agreed) return;
    try {
      localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } catch { /* ignore */ }
  }, [params, agreed]);

  useEffect(() => {
    if (tickers.length === 0 && agreed) {
      const savedWatchlist = localStorage.getItem(getWatchlistKey(market));
      if (savedWatchlist) {
        const data = JSON.parse(savedWatchlist);
        if (data.tickers?.length) {
          setTickers(data.tickers);
          return;
        }
      }
      setTickers(getDefaultTickers(market));
    }
  }, [market, tickers.length, agreed]);

  /* extract company info from proxy meta response */
  const extractCompanyInfo = (meta: Record<string, unknown>): CompanyInfo => {
    return {
      shortName: meta.shortName as string,
      longName: meta.longName as string,
      currency: meta.currency as string,
      exchangeName: meta.exchangeName as string,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh as number,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow as number,
      regularMarketDayHigh: meta.regularMarketDayHigh as number,
      regularMarketDayLow: meta.regularMarketDayLow as number,
      regularMarketVolume: meta.regularMarketVolume as number,
    };
  };

  /* fetch PBV, PER, EPS from Yahoo Finance page scraping */
  const fetchFundamentals = useCallback(async (symbols: string[]): Promise<Record<string, Partial<CompanyInfo>>> => {
    try {
      const res = await fetch(`/api/fundamentals?t=${encodeURIComponent(symbols.join(","))}`);
      if (!res.ok) return {};
      const data = await res.json();
      return data;
    } catch {
      return {};
    }
  }, []);

  const computeAll = useCallback(async (skipCache = false) => {
    setLoading(true);
    const results: TickerScore[] = [];
    const r = findRange(range);

    /* fetch OHLC + meta for all tickers */
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
        let meta: Record<string, unknown> = {};
        if (res.ok) {
          const data = await res.json();
          ohlc = data.ohlc ?? [];
          meta = data.meta ?? {};
        }

        if (ohlc.length < 10) {
          results.push({ ticker: displayTicker, indicators: [], greenCount: 0, redCount: 0 });
          continue;
        }

        const indicators = computeAllIndicators(ohlc, params);
        const last = ohlc[ohlc.length - 1];
        const prev = ohlc[ohlc.length - 2];

        const companyName = (meta.shortName as string) ?? (meta.longName as string) ?? displayTicker;
        const companyInfo = extractCompanyInfo(meta);

        const score: TickerScore = {
          ticker: displayTicker,
          name: companyName,
          companyInfo,
          price: meta.regularMarketPrice as number ?? last.close,
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

    /* fetch fundamentals (PBV, PER, EPS) in background — doesn't block UI */
    const fullTickers = tickers.map((t) => applySuffix(t, market));
    fetchFundamentals(fullTickers).then((fundMap) => {
      setScores((prev) =>
        sortByTrend(
          prev.map((s) => {
            const fullTicker = applySuffix(s.ticker, market);
            const fund = fundMap[fullTicker];
            if (fund && s.companyInfo) {
              return {
                ...s,
                companyInfo: { ...s.companyInfo, ...fund },
              };
            }
            return s;
          })
        )
      );
    });
  }, [tickers, market, range, params, fetchFundamentals]);

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

  const handleLogout = () => {
    /* save current watchlist before switching */
    try {
      localStorage.setItem(getWatchlistKey(market), JSON.stringify({ tickers }));
    } catch { /* ignore */ }
    localStorage.removeItem(AGREED_KEY);
    setAgreed(false);
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
          localStorage.setItem(AGREED_KEY, "true");
          setMarket(m);
          /* load saved watchlist for this market, or use defaults */
          const savedWatchlist = localStorage.getItem(getWatchlistKey(m));
          if (savedWatchlist) {
            const data = JSON.parse(savedWatchlist);
            if (data.tickers?.length) {
              setTickers(data.tickers);
            } else {
              setTickers(getDefaultTickers(m));
            }
          } else {
            setTickers(getDefaultTickers(m));
          }
          setAgreed(true);
        }}
      />
    );
  }

  const marketInfo = getMarket(market);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
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
          <button
            onClick={handleLogout}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            title="Change market"
          >
            Switch
          </button>
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
        style={{ overscrollBehaviorY: "contain" }}
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
                  {scores.length * 4 - totalGreen - totalRed}
                </span>
              </span>
            </div>
          )}

          {/* indicator legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              Market Filter
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              Trend
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              Money Flow
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              Volatility
            </span>
          </div>

          {/* stock cards with blur overlay when loading */}
          <div className="relative border border-zinc-800 rounded-xl overflow-hidden">
            {loading && scores.length > 0 && (
              <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Updating...
                </div>
              </div>
            )}
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
          companyInfo={scores.find((s) => s.ticker === selectedTicker)?.companyInfo}
          onClose={() => setSelectedTicker(null)}
        />
      )}
    </div>
  );
}
