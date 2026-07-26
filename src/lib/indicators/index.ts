import { OHLC, IndicatorResult, IndicatorParams, IndicatorFn } from "../provider/types";
import { macdIndicator } from "./macd";
import { rsiIndicator } from "./rsi";
import { volumeIndicator } from "./volume";
import { zigzagIndicator } from "./zigzag";
import { alligatorIndicator } from "./alligator";
import { cmfIndicator } from "./cmf";
import { adxIndicator } from "./adx";
import { obvIndicator } from "./obv";
import { vwapIndicator } from "./vwap";
import { ema200Indicator } from "./ema200";
import { emaCross50200Indicator } from "./emaCross50200";
import { bbIndicator } from "./bb";
import { breakoutIndicator } from "./breakout";
import { signalIndicator } from "./signal";

export interface IndicatorMeta {
  name: string;
  fn: IndicatorFn;
  defaultParams: IndicatorParams;
  shortDesc: string;
  background: string;
  interpretation: {
    green: string;
    red: string;
    grey: string;
  };
}

export const INDICATOR_REGISTRY: IndicatorMeta[] = [
  {
    name: "Alligator", fn: alligatorIndicator,
    defaultParams: { jawPeriod: 13, teethPeriod: 8, lipsPeriod: 5, jawShift: 8, teethShift: 5, lipsShift: 3 },
    shortDesc: "Bill Williams Alligator — 3 WEMAs (jaw/teeth/lips) market state",
    background: "Developed by Bill Williams, the Alligator uses three smoothed moving averages (WEMAs) to identify trend states. The Jaw (blue, 13-period) is the slowest, Teeth (red, 8-period) is the middle, and Lips (green, 5-period) is the fastest. When the lines are intertwined, the Alligator is 'sleeping' (ranging). When they diverge with Lips > Teeth > Jaw, it's 'eating up' (uptrend). When Lips < Teeth < Jaw, it's 'eating down' (downtrend).",
    interpretation: {
      green: "Alligator awake — lines diverging, market trending.",
      red: "Alligator awake — lines diverging, market trending.",
      grey: "Alligator sleeping — lines tangled, market ranging.",
    },
  },
  {
    name: "ADX", fn: adxIndicator,
    defaultParams: { period: 14 },
    shortDesc: "Average Directional Index — trend strength (no direction)",
    background: "Developed by J. Welles Wilder Jr., ADX measures trend strength regardless of direction. It ranges from 0 to 100. ADX above 25 indicates a strong trend exists, while ADX below 20 suggests no clear trend. ADX is calculated from the directional movement indicators (+DI and -DI) and smoothed over the period.",
    interpretation: {
      green: "ADX > 25 — real trend exists, directional movement strong.",
      red: "ADX > 25 — real trend exists, directional movement strong.",
      grey: "ADX ≤ 25 — no clear trend, market ranging.",
    },
  },
  {
    name: "EMA 200", fn: ema200Indicator,
    defaultParams: { period: 200 },
    shortDesc: "Price vs 200 EMA — long-term trend direction",
    background: "The 200-day Exponential Moving Average is one of the most widely followed long-term trend indicators. It smooths price data over approximately 40 weeks of trading. Price above the 200 EMA is considered bullish (long-term uptrend), while price below is bearish (long-term downtrend). The 200 EMA acts as dynamic support/resistance.",
    interpretation: {
      green: "Price > 200 EMA — long-term trend is bullish.",
      red: "Price < 200 EMA — long-term trend is bearish.",
      grey: "Insufficient data or price near 200 EMA — direction unclear.",
    },
  },
  {
    name: "EMA 50/200", fn: emaCross50200Indicator,
    defaultParams: { fastPeriod: 50, slowPeriod: 200 },
    shortDesc: "50/200 EMA Cross — golden/death cross detection",
    background: "The 50/200 EMA cross is a classic trend-following signal. When the 50 EMA crosses above the 200 EMA, it's called a 'Golden Cross' (bullish). When it crosses below, it's a 'Death Cross' (bearish). This indicator shows the current state: 50 above or below 200.",
    interpretation: {
      green: "50 EMA > 200 EMA — golden cross active, bullish alignment.",
      red: "50 EMA < 200 EMA — death cross active, bearish alignment.",
      grey: "Insufficient data — cannot compute 50/200 EMA.",
    },
  },
  {
    name: "MACD", fn: macdIndicator,
    defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    shortDesc: "Moving Average Convergence Divergence — momentum direction",
    background: "Developed by Gerald Appel in the 1970s, MACD measures the relationship between two exponential moving averages (EMAs) of price. The MACD line is the difference between the 12-day and 26-day EMA. A 9-day EMA of the MACD line (signal line) is plotted on top. The histogram shows the distance between MACD and signal. MACD is a trend-following momentum indicator.",
    interpretation: {
      green: "MACD > 0 — bullish momentum, MACD line above zero.",
      red: "MACD < 0 — bearish momentum, MACD line below zero.",
      grey: "MACD near zero — momentum neutral, trend unclear.",
    },
  },
  {
    name: "VWAP", fn: vwapIndicator,
    defaultParams: {},
    shortDesc: "Volume Weighted Average Price — institutional fair value",
    background: "VWAP calculates the average price weighted by volume, representing the 'fair value' according to institutional traders. Price above VWAP suggests buyers are in control (bullish), while price below suggests sellers are dominant (bearish). Used by institutions to benchmark execution quality.",
    interpretation: {
      green: "Close > VWAP — price above institutional fair value, bullish.",
      red: "Close < VWAP — price below institutional fair value, bearish.",
      grey: "Insufficient data — cannot compute VWAP.",
    },
  },
  {
    name: "OBV", fn: obvIndicator,
    defaultParams: { period: 20 },
    shortDesc: "On Balance Volume — volume trend direction",
    background: "On Balance Volume (OBV), developed by Joseph Granville,累积s volume based on price direction. Volume is added when close is higher than previous close, subtracted when lower. Rising OBV confirms uptrend with volume backing; falling OBV confirms downtrend.",
    interpretation: {
      green: "OBV rising — volume backing the move, accumulation.",
      red: "OBV falling — volume backing the move, distribution.",
      grey: "OBV flat — no clear volume trend.",
    },
  },
  {
    name: "CMF", fn: cmfIndicator,
    defaultParams: { period: 20 },
    shortDesc: "Chaikin Money Flow — institutional accumulation/distribution",
    background: "Developed by Marc Chaikin, CMF measures the accumulation/distribution of money flow over a period. It calculates the Money Flow Multiplier based on the close position within the high-low range, multiplies by volume, and sums over the period. CMF ranges from -1 to +1, with positive values indicating buying pressure and negative values indicating selling pressure.",
    interpretation: {
      green: "CMF > +0.05 — net money flowing in, accumulation by large players.",
      red: "CMF < −0.05 — net money flowing out, distribution by large players.",
      grey: "CMF near zero — balanced flow, no institutional bias.",
    },
  },
  {
    name: "Volume", fn: volumeIndicator,
    defaultParams: { avgPeriod: 50, threshold: 1.5 },
    shortDesc: "Volume vs 50-day average — confirms or weakens price moves",
    background: "Volume analysis is one of the oldest forms of technical analysis. Volume represents the total number of shares traded during a period. High volume confirms price moves and indicates strong interest. Low volume suggests weak moves that may reverse. The volume-price relationship is key: rising prices with rising volume confirms uptrends.",
    interpretation: {
      green: "Volume > 1.5x average + closing up — strong buying interest.",
      red: "Volume > 1.5x average + closing down — strong selling pressure.",
      grey: "Volume below 1.5x average — low participation, move unreliable.",
    },
  },
  {
    name: "BB Squeeze", fn: bbIndicator,
    defaultParams: { period: 20, stdDev: 2.0, squeezeLookback: 120 },
    shortDesc: "Bollinger Bands Squeeze — volatility contraction",
    background: "Bollinger Bands measure volatility by plotting bands at standard deviations from a moving average. When bandwidth reaches a 120-day low, it's called a 'squeeze' — volatility has contracted to extremes. Squeezes often precede big moves. The direction of the breakout determines the trade direction.",
    interpretation: {
      green: "BB Width at 120-day low — squeeze occurred, big move imminent.",
      red: "BB Width at 120-day low — squeeze occurred, big move imminent.",
      grey: "No squeeze — volatility at normal levels.",
    },
  },
  {
    name: "Breakout", fn: breakoutIndicator,
    defaultParams: { period: 20, stdDev: 2.0, swingLookback: 10 },
    shortDesc: "Breakout / Breakdown — price breaking key levels",
    background: "Breakout occurs when price closes above the upper Bollinger Band (long signal). Breakdown occurs when price closes below the last swing low (short signal). These are key structural breaks indicating potential trend continuation or reversal.",
    interpretation: {
      green: "Close > Upper BB — long breakout, bullish momentum.",
      red: "Close < Last Swing Low — short breakdown, bearish momentum.",
      grey: "No breakout — price within range.",
    },
  },
  {
    name: "Signal", fn: signalIndicator,
    defaultParams: {
      emaFast: 50, emaSlow: 200, adxPeriod: 14, adxThreshold: 25,
      cmfPeriod: 20, cmfThreshold: 0.05, bbPeriod: 20, bbStdDev: 2.0,
      volumeAvgPeriod: 50, volumeThreshold: 1.5,
      alligatorJaw: 13, alligatorTeeth: 8, alligatorLips: 5,
      jawShift: 8, teethShift: 5, lipsShift: 3,
    },
    shortDesc: "Signal Triangle — final 'pull the trigger' marker",
    background: "Signal triangles only print when ALL rules across all groups agree. They are the final confirmation that institutional money is moving. BUY signal requires: bullish trend alignment, money flow confirmation, volatility squeeze, and breakout with volume. SELL signal requires: bearish trend, distribution, and breakdown with volume.",
    interpretation: {
      green: "BUY signal — all rules agree, institutional breakout confirmed.",
      red: "SELL signal — all rules agree, institutional distribution confirmed.",
      grey: "No signal — not all conditions met.",
    },
  },
  // Legacy indicators (kept for StockDetail chart compatibility)
  {
    name: "RSI", fn: rsiIndicator,
    defaultParams: { period: 14 },
    shortDesc: "Relative Strength Index — overbought/oversold oscillator",
    background: "RSI measures the speed and magnitude of recent price changes. It oscillates between 0 and 100. Traditional interpretation considers RSI above 70 overbought and below 30 oversold.",
    interpretation: {
      green: "RSI above 55 — buying pressure dominant.",
      red: "RSI below 45 — selling pressure dominant.",
      grey: "RSI between 45–55 — equilibrium.",
    },
  },
  {
    name: "ZigZag", fn: zigzagIndicator,
    defaultParams: { minSwing: 5 },
    shortDesc: "ZigZag — filters noise to show swing high/low structure",
    background: "ZigZag filters out minor price movements to show significant swing highs and lows, revealing the underlying trend structure.",
    interpretation: {
      green: "Last pivot was swing low — higher-low structure forming.",
      red: "Last pivot was swing high — lower-high structure forming.",
      grey: "Mid-leg, no confirmed pivot.",
    },
  },
];

export function computeAllIndicators(
  ohlc: OHLC[],
  paramOverrides?: Record<string, IndicatorParams>
): IndicatorResult[] {
  return INDICATOR_REGISTRY.map((reg) => {
    const params = paramOverrides?.[reg.name];
    try {
      return reg.fn(ohlc, params ?? reg.defaultParams);
    } catch {
      return { name: reg.name, color: "grey" as const, value: "err" };
    }
  });
}

export function greenCount(indicators: IndicatorResult[]): number {
  return indicators.filter((i) => i.color === "green").length;
}

export function redCount(indicators: IndicatorResult[]): number {
  return indicators.filter((i) => i.color === "red").length;
}
