import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };

export function macdIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "MACD", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const result = TI.MACD.calculate({
      values: closes,
      fastPeriod: p.fastPeriod,
      slowPeriod: p.slowPeriod,
      signalPeriod: p.signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    if (result.length < 3) return { name: "MACD", color: "grey", value: "N/A" };

    const last = result[result.length - 1];
    const prev = result[result.length - 2];
    const hist = last.MACD - last.signal;
    const prevHist = prev.MACD - prev.signal;

    let color: "green" | "red" | "grey" = "grey";
    if (hist > 0 && hist > prevHist) color = "green";
    else if (hist < 0 && hist < prevHist) color = "red";

    return { name: "MACD", color, value: hist.toFixed(2) };
  } catch {
    return { name: "MACD", color: "grey", value: "err" };
  }
}
