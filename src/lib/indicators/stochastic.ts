import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = {
  period: 14,
  signalPeriod: 3,
  smoothK: 3,
};

export function stochasticIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "Stochastic", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const highs = ohlc.map((c) => c.high);
  const lows = ohlc.map((c) => c.low);
  const closes = ohlc.map((c) => c.close);

  try {
    const result = TI.Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: p.period,
      signalPeriod: p.signalPeriod,
    });

    if (result.length < 2) return { name: "Stochastic", color: "grey", value: "N/A" };

    const last = result[result.length - 1];
    const prev = result[result.length - 2];
    const k = last.k;
    const d = last.d;
    const prevK = prev.k;
    const prevD = prev.d;

    let color: "green" | "red" | "grey" = "grey";
    if (k > d && prevK <= prevD && k < 80) color = "green";
    else if (k < d && prevK >= prevD && k > 20) color = "red";
    else if (k > d && k < 80) color = "green";
    else if (k < d && k > 20) color = "red";

    return { name: "Stochastic", color, value: `K:${k.toFixed(1)}` };
  } catch {
    return { name: "Stochastic", color: "grey", value: "err" };
  }
}
