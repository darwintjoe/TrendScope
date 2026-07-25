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
  background: string;
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
    background: "Developed by Gerald Appel in the 1970s, MACD measures the relationship between two exponential moving averages (EMAs) of price. The MACD line is the difference between the 12-day and 26-day EMA. A 9-day EMA of the MACD line (signal line) is plotted on top. The histogram shows the distance between MACD and signal. MACD is a trend-following momentum indicator that shows the relationship between two moving averages of prices.",
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
    background: "Developed by J. Welles Wilder Jr. in 1978, RSI measures the speed and magnitude of recent price changes. It oscillates between 0 and 100, calculated as: RSI = 100 - (100 / (1 + RS)), where RS is the average gain divided by average loss over the period. Traditional interpretation considers RSI above 70 overbought and below 30 oversold, though these levels can be adjusted for different markets.",
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
    background: "Developed by George Lane in the 1950s, the Stochastic Oscillator compares a security's closing price to its price range over a given period. %K is the current closing price divided by the highest high over the period, multiplied by 100. %D is a moving average of %K. The oscillator shows where the close is relative to the high-low range, indicating momentum and potential reversal points.",
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
    background: "Volume analysis is one of the oldest forms of technical analysis. Volume represents the total number of shares or contracts traded during a period. High volume confirms price moves and indicates strong interest. Low volume suggests weak moves that may reverse. The volume-price relationship is key: rising prices with rising volume confirms uptrends, while rising prices with falling volume suggests weakness.",
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
    background: "Developed by Bill Williams, Fractals identify potential reversal points by finding patterns of five consecutive bars where the middle bar has the highest high (up fractal) or lowest low (down fractal). A fractal forms when a bar's high is higher than the two bars on each side (up fractal) or a bar's low is lower than the two bars on each side (down fractal). These patterns help identify support/resistance levels and breakout points.",
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
    background: "ZigZag filters out minor price movements and noise to show significant swing highs and lows. It connects swing points that exceed a minimum percentage or point threshold, revealing the underlying trend structure. This helps identify higher highs, higher lows (uptrend) or lower highs, lower lows (downtrend). The ZigZag is not predictive but descriptive, showing the current market structure.",
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
    background: "Exponential Moving Average (EMA) crossovers are a classic trend-following technique. The fast EMA (9-period) reacts quickly to price changes, while the slow EMA (21-period) smooths out noise. When the fast EMA crosses above the slow EMA, it signals bullish momentum. The threshold filter (0.2%) reduces false signals from minor fluctuations. EMA crossovers work best in trending markets and can whipsaw in sideways conditions.",
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
    background: "Fast Fourier Transform (FFT) analysis decomposes price data into frequency components to identify dominant cycles. Markets exhibit cyclical behavior due to human psychology, trading patterns, and economic cycles. The dominant frequency shows the most prevalent cycle length, helping traders understand the natural rhythm of price movements. This is particularly useful for timing entries and exits aligned with the dominant cycle.",
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
    background: "Developed by Bill Williams, the Alligator uses three smoothed moving averages (WEMAs) to identify trend states. The Jaw (blue, 13-period) is the slowest, Teeth (red, 8-period) is the middle, and Lips (green, 5-period) is the fastest. When the lines are intertwined, the Alligator is 'sleeping' (ranging). When they diverge with Lips > Teeth > Jaw, it's 'eating up' (uptrend). When Lips < Teeth < Jaw, it's 'eating down' (downtrend).",
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
    background: "Developed by Marc Chaikin, CMF measures the accumulation/distribution of money flow over a period. It calculates the Money Flow Multiplier based on the close position within the high-low range, multiplies by volume, and sums over the period. CMF ranges from -1 to +1, with positive values indicating buying pressure (accumulation) and negative values indicating selling pressure (distribution). It helps identify institutional activity and trend sustainability.",
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
