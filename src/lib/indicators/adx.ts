import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { period: 14 };

/**
 * Average Directional Index — trend strength (no direction).
 *
 * White: ADX > 25 (real trend exists)
 * Grey:  ADX ≤ 25 (no trend)
 */
export function adxIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "ADX", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const highs = ohlc.map((c) => c.high);
  const lows = ohlc.map((c) => c.low);
  const closes = ohlc.map((c) => c.close);

  try {
    const result = TI.ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: p.period,
    });

    if (!result || result.length === 0) {
      return { name: "ADX", color: "grey", value: "N/A" };
    }

    const adx = result[result.length - 1];
    const color: "green" | "red" | "grey" = adx > 25 ? "green" : "grey";

    return { name: "ADX", color, value: adx.toFixed(1) };
  } catch {
    return { name: "ADX", color: "grey", value: "err" };
  }
}
