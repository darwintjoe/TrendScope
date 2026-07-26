import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { fastPeriod: 50, slowPeriod: 200 };

/**
 * 50/200 EMA Cross — medium vs long-term trend direction.
 *
 * Green: 50 EMA > 200 EMA (golden cross, bullish)
 * Red:   50 EMA < 200 EMA (death cross, bearish)
 * Grey:  Insufficient data
 */
export function emaCross50200Indicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "EMA 50/200", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const fastRaw = TI.EMA.calculate({ values: closes, period: p.fastPeriod });
    const slowRaw = TI.EMA.calculate({ values: closes, period: p.slowPeriod });

    if (!fastRaw.length || !slowRaw.length) {
      return { name: "EMA 50/200", color: "grey", value: "N/A" };
    }

    const fast = fastRaw[fastRaw.length - 1];
    const slow = slowRaw[slowRaw.length - 1];

    let color: "green" | "red" | "grey" = "grey";
    if (fast > slow) color = "green";
    else if (fast < slow) color = "red";

    return { name: "EMA 50/200", color, value: `${fast.toFixed(1)} > ${slow.toFixed(1)}` };
  } catch {
    return { name: "EMA 50/200", color: "grey", value: "err" };
  }
}
