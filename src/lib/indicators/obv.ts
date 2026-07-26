import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

const DEFAULTS: IndicatorParams = { period: 20 };

/**
 * On Balance Volume — volume trend direction.
 *
 * Green: OBV rising (above OBV 20 days ago)
 * Red:   OBV falling (below OBV 20 days ago)
 * Grey:  OBV flat or insufficient data
 */
export function obvIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < p.period + 1) {
    return { name: "OBV", color: "grey", value: "N/A" };
  }

  let obv = 0;
  const obvValues: number[] = [];

  for (let i = 0; i < ohlc.length; i++) {
    if (i === 0) {
      obvValues.push(0);
      continue;
    }

    if (ohlc[i].close > ohlc[i - 1].close) {
      obv += ohlc[i].volume;
    } else if (ohlc[i].close < ohlc[i - 1].close) {
      obv -= ohlc[i].volume;
    }
    obvValues.push(obv);
  }

  const currentOBV = obvValues[obvValues.length - 1];
  const pastOBV = obvValues[obvValues.length - 1 - p.period];

  let color: "green" | "red" | "grey" = "grey";
  if (currentOBV > pastOBV) color = "green";
  else if (currentOBV < pastOBV) color = "red";

  const diff = ((currentOBV - pastOBV) / Math.abs(pastOBV || 1)) * 100;
  return { name: "OBV", color, value: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%` };
}
