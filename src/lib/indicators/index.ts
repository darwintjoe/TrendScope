import { OHLC, IndicatorResult, IndicatorParams, IndicatorFn } from "../provider/types";
import { macdIndicator } from "./macd";
import { rsiIndicator } from "./rsi";
import { stochasticIndicator } from "./stochastic";
import { volumeIndicator } from "./volume";
import { fractalIndicator } from "./fractal";
import { zigzagIndicator } from "./zigzag";
import { emaCrossIndicator } from "./emaCross";
import { alligatorIndicator } from "./alligator";
import { cmfIndicator } from "./cmf";
import { frequencyColor } from "../fft/frequency";

export interface IndicatorMeta {
  name: string;
  fn: IndicatorFn;
  defaultParams: IndicatorParams;
  shortDesc: string;
  interpretation: {
    green: string;
    red: string;
    grey: string;
  };
}

export const INDICATOR_REGISTRY: IndicatorMeta[] = [
  {
    name: "MACD", fn: macdIndicator,
    defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    shortDesc: "Moving Average Convergence Divergence — momentum trend direction",
    interpretation: {
      green: "Histogram positive and rising → bullish momentum accelerating. MACD line above signal line confirms uptrend.",
      red: "Histogram negative and falling → bearish momentum accelerating. MACD line below signal line confirms downtrend.",
      grey: "Histogram flat or crossing zero → momentum neutral, trend unclear. Wait for clearer signal.",
    },
  },
  {
    name: "RSI", fn: rsiIndicator,
    defaultParams: { period: 14 },
    shortDesc: "Relative Strength Index — overbought/oversold oscillator (0–100)",
    interpretation: {
      green: "RSI above 55 → buying pressure dominant. Uptrend strength confirmed without overbought extreme yet.",
      red: "RSI below 45 → selling pressure dominant. Downtrend strength confirmed without oversold extreme yet.",
      grey: "RSI between 45–55 → equilibrium. Neither buyers nor sellers in control.",
    },
  },
  {
    name: "Stochastic", fn: stochasticIndicator,
    defaultParams: { period: 14, signalPeriod: 3 },
    shortDesc: "Stochastic Oscillator — %K/%D position within recent range",
    interpretation: {
      green: "%K above %D and below 80 → bullish momentum with room to run before overbought.",
      red: "%K below %D and above 20 → bearish momentum with room to fall before oversold.",
      grey: "Lines tangled or at extremes → momentum unclear, possible reversal zone.",
    },
  },
  {
    name: "Volume", fn: volumeIndicator,
    defaultParams: { avgPeriod: 20 },
    shortDesc: "Volume vs 20-day average — confirms or weakens price moves",
    interpretation: {
      green: "Volume above average + closing up → strong buying interest backing the move.",
      red: "Volume above average + closing down → strong selling pressure, distribution underway.",
      grey: "Volume below average → low participation, price move unreliable.",
    },
  },
  {
    name: "Fractal", fn: fractalIndicator,
    defaultParams: { lookback: 5 },
    shortDesc: "Bill Williams Fractal — pivot point breakout detection",
    interpretation: {
      green: "Price above recent up-fractal → breakout above resistance pivot, uptrend intact.",
      red: "Price below recent down-fractal → breakdown below support pivot, downtrend intact.",
      grey: "No recent fractal or price mid-range → no clear pivot breakout.",
    },
  },
  {
    name: "ZigZag", fn: zigzagIndicator,
    defaultParams: { minSwing: 5 },
    shortDesc: "ZigZag — filters noise to show swing high/low structure",
    interpretation: {
      green: "Last pivot was swing low → higher-low structure forming, uptrend pattern.",
      red: "Last pivot was swing high → lower-high structure forming, downtrend pattern.",
      grey: "Mid-leg, no confirmed pivot → trend structure forming.",
    },
  },
  {
    name: "EMA Cross", fn: emaCrossIndicator,
    defaultParams: { fastPeriod: 9, slowPeriod: 21, threshold: 0.002 },
    shortDesc: "EMA 9/21 crossover — short vs medium trend direction",
    interpretation: {
      green: "EMA9 above EMA21 by >0.2% → short-term trend stronger, bullish alignment.",
      red: "EMA9 below EMA21 by >0.2% → short-term trend weaker, bearish alignment.",
      grey: "EMAs intertwined (within 0.2%) → trend transition zone, direction ambiguous.",
    },
  },
  {
    name: "Frequency", fn: frequencyColor,
    defaultParams: {},
    shortDesc: "FFT dominant cycle — detects natural rhythm in price oscillation",
    interpretation: {
      green: "Dominant cycle in up-phase → price trending up within its natural cycle.",
      red: "Dominant cycle in down-phase → price trending down within its natural cycle.",
      grey: "Cycle too short or ambiguous → no reliable dominant frequency detected.",
    },
  },
  {
    name: "Alligator", fn: alligatorIndicator,
    defaultParams: { jawPeriod: 13, teethPeriod: 8, lipsPeriod: 5, jawShift: 8, teethShift: 5, lipsShift: 3 },
    shortDesc: "Bill Williams Alligator — 3 WEMAs (jaw/teeth/lips) trend state",
    interpretation: {
      green: "Price > lips > teeth > jaw → perfect bullish alignment, alligator eating up.",
      red: "Price < lips < teeth < jaw → perfect bearish alignment, alligator eating down.",
      grey: "Lines tangled/interleaved → alligator sleeping, no trend.",
    },
  },
  {
    name: "CMF", fn: cmfIndicator,
    defaultParams: { period: 20 },
    shortDesc: "Chaikin Money Flow — institutional accumulation/distribution",
    interpretation: {
      green: "CMF > +0.05 → net money flowing in, accumulation by large players.",
      red: "CMF < −0.05 → net money flowing out, distribution by large players.",
      grey: "CMF near zero → balanced flow, no institutional bias.",
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
