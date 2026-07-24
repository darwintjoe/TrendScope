import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { period: 20 };

/**
 * Chaikin Money Flow — institutional accumulation/distribution.
 *
 * MFM = ((Close - Low) - (High - Close)) / (High - Low)
 * MFV = MFM × Volume
 * CMF = Σ(MFV, N) / Σ(Volume, N)
 *
 * Green:  CMF > +0.05  (accumulation)
 * Red:    CMF < −0.05  (distribution)
 * Grey:   |CMF| ≤ 0.05 (neutral)
 */
export function cmfIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < p.period) {
    return { name: "CMF", color: "grey", value: "N/A" };
  }

  const slice = ohlc.slice(-p.period);
  let sumMFV = 0;
  let sumVol = 0;

  for (const bar of slice) {
    const hl = bar.high - bar.low;
    if (hl === 0) continue;
    const mfm = (bar.close - bar.low - (bar.high - bar.close)) / hl;
    const mfv = mfm * bar.volume;
    sumMFV += mfv;
    sumVol += bar.volume;
  }

  if (sumVol === 0) return { name: "CMF", color: "grey", value: "0" };

  const cmf = sumMFV / sumVol;

  let color: "green" | "red" | "grey" = "grey";
  if (cmf > 0.05) color = "green";
  else if (cmf < -0.05) color = "red";

  return { name: "CMF", color, value: cmf.toFixed(3) };
}
