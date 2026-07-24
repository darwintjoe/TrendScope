import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = {
  jawPeriod: 13,
  teethPeriod: 8,
  lipsPeriod: 5,
  jawShift: 8,
  teethShift: 5,
  lipsShift: 3,
};

/**
 * Bill Williams Alligator: 3 smoothed moving averages (WEMA)
 * shifted forward. Jaw=13, Teeth=8, Lips=5.
 *
 * Uptrend:   price > lips > teeth > jaw
 * Downtrend: price < lips < teeth < jaw
 * Otherwise: tangled (grey)
 */
export function alligatorIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "Alligator", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };
  const closes = ohlc.map((c) => c.close);

  try {
    const jawRaw = TI.WEMA.calculate({ values: closes, period: p.jawPeriod });
    const teethRaw = TI.WEMA.calculate({ values: closes, period: p.teethPeriod });
    const lipsRaw = TI.WEMA.calculate({ values: closes, period: p.lipsPeriod });

    if (jawRaw.length < p.jawShift || teethRaw.length < p.teethShift || lipsRaw.length < p.lipsShift) {
      return { name: "Alligator", color: "grey", value: "N/A" };
    }

    /* shift = take value N bars ago (simulating forward shift on historical) */
    const jaw = jawRaw[jawRaw.length - 1 - p.jawShift];
    const teeth = teethRaw[teethRaw.length - 1 - p.teethShift];
    const lips = lipsRaw[lipsRaw.length - 1 - p.lipsShift];
    const current = closes[closes.length - 1];

    let color: "green" | "red" | "grey" = "grey";
    if (current > lips && lips > teeth && teeth > jaw) color = "green";
    else if (current < lips && lips < teeth && teeth < jaw) color = "red";

    return { name: "Alligator", color, value: `${lips.toFixed(1)}` };
  } catch {
    return { name: "Alligator", color: "grey", value: "err" };
  }
}
