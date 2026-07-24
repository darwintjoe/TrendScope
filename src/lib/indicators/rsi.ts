import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { period: 14, overbought: 70, oversold: 30 };

export function rsiIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "RSI", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const result = TI.RSI.calculate({ values: closes, period: p.period });
    if (result.length === 0) return { name: "RSI", color: "grey", value: "N/A" };

    const rsi = result[result.length - 1];

    let color: "green" | "red" | "grey" = "grey";
    if (rsi > 55) color = "green";
    else if (rsi < 45) color = "red";

    return { name: "RSI", color, value: rsi.toFixed(1) };
  } catch {
    return { name: "RSI", color: "grey", value: "err" };
  }
}
