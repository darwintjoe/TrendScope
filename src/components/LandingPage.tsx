"use client";

import { useState } from "react";
import { MARKETS } from "@/lib/market";

interface LandingPageProps {
  initialMarket: string;
  onAgree: (market: string) => void;
}

export function LandingPage({ initialMarket, onAgree }: LandingPageProps) {
  const [checked, setChecked] = useState(false);
  const [market, setMarket] = useState(initialMarket);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-24">
        {/* logo + title */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">📊</div>
          <h1 className="text-xl font-bold tracking-tight">TrendScope</h1>
          <p className="text-[11px] text-zinc-500 mt-1">Stock Trend Strength Scoring</p>
        </div>

        {/* what is */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            What is TrendScope
          </h2>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            TrendScope scores stocks using <span className="text-zinc-200 font-medium">10 technical indicators</span> — MACD, RSI, Stochastic, Volume, Fractal, ZigZag, EMA Cross, Frequency (FFT), Alligator, and Chaikin Money Flow.
            Each indicator outputs a color: <span className="text-green-400 font-medium">green</span> for uptrend, <span className="text-red-400 font-medium">red</span> for downtrend, <span className="text-zinc-400 font-medium">grey</span> for neutral. Stocks with more green indicators tend to have stronger uptrend possibilities.
          </p>
        </section>

        {/* how to use */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            How to use
          </h2>
          <ul className="space-y-1 text-[11px] text-zinc-400 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">1.</span>
              <span>Select your market from the dropdown below, then agree and continue.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">2.</span>
              <span>Top-10 stocks load automatically. Add up to 10 custom tickers.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">3.</span>
              <span>View the color dots — more green = stronger uptrend signals.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">4.</span>
              <span>Tap a ticker name to open the chart, indicator values, and interpretation.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 shrink-0">5.</span>
              <span>Switch ranges from 30 minutes to 5 years. Adjust indicator parameters.</span>
            </li>
          </ul>
        </section>

        {/* limitations */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Limitations
          </h2>
          <ul className="space-y-1 text-[11px] text-zinc-400 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">•</span>
              <span>Data sourced from Yahoo Finance — may be delayed or unavailable for some tickers.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">•</span>
              <span>Only 10 indicators — does not cover all technical analysis methods.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">•</span>
              <span>Intraday data limited to 30-minute intervals, maximum 5 days back.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-500 shrink-0">•</span>
              <span>China (.SS/.SZ) and some tickers may return incomplete data.</span>
            </li>
          </ul>
        </section>

        {/* disclaimer */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Disclaimer
          </h2>
          <div className="text-[10px] text-zinc-500 leading-relaxed bg-zinc-900 rounded-lg p-3 border border-zinc-800">
            <p className="mb-1.5">
              <span className="text-zinc-400 font-medium">Not financial advice.</span> TrendScope is an educational and research tool only. Nothing in this application constitutes investment advice, a recommendation, or a solicitation to buy or sell any security.
            </p>
            <p className="mb-1.5">
              Technical indicators are based on historical data and do not guarantee future results. Past performance is not indicative of future outcomes.
            </p>
            <p className="mb-1.5">
              Always conduct your own research and consult a qualified financial advisor before making investment decisions. Use this tool at your own risk.
            </p>
            <p>
              Data is provided by Yahoo Finance for informational purposes. We do not guarantee accuracy, completeness, or timeliness of any data displayed.
            </p>
          </div>
        </section>
      </div>

      {/* pinned bottom: agree + continue */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex items-start gap-2.5 cursor-pointer flex-1">
            <input
              type="checkbox"
              id="agree-checkbox"
              name="agree"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 shrink-0"
            />
            <span className="text-[11px] text-zinc-400 leading-snug">
              I have read and understand the above information, limitations, and disclaimer.
            </span>
          </label>
          <select
            id="market-select"
            name="market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shrink-0"
          >
            {MARKETS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.flag} {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onAgree(market)}
          disabled={!checked}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            checked
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
