import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = { fastPeriod: 9, slowPeriod: 21, threshold: 0.002 };

export function emaCrossIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "EMA Cross", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const fast = TI.EMA.calculate({ values: closes, period: p.fastPeriod });
    const slow = TI.EMA.calculate({ values: closes, period: p.slowPeriod });

    if (fast.length === 0 || slow.length === 0) {
      return { name: "EMA Cross", color: "grey", value: "N/A" };
    }

    /* fast is longer by (slowPeriod - fastPeriod) elements */
    const offset = slow.length - fast.length;

    const f = fast[fast.length - 1];
    const s = slow[slow.length - 1];

    const diff = (f - s) / s;

    let color: "green" | "red" | "grey" = "grey";
    if (diff > p.threshold) color = "green";
    else if (diff < -p.threshold) color = "red";

    return { name: "EMA Cross", color, value: `${(diff * 100).toFixed(2)}%` };
  } catch {
    return { name: "EMA Cross", color: "grey", value: "err" };
  }
}
