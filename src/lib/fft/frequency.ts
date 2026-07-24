import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/**
 * FFT wrapper using fft.js for frequency analysis.
 * Finds dominant cycle period in close prices.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FFTLib = (typeof window !== "undefined" ? require("fft.js") : null);

export function findDominantPeriod(closes: number[]): number | null {
  if (!FFTLib || closes.length < 16) return null;

  /* pad to next power of 2 */
  let n = 1;
  while (n < closes.length) n <<= 1;

  const fft = new FFTLib(n);
  const input = new Float64Array(n);
  const output = new Float64Array(n * 2);

  /* copy & detrend (subtract mean) */
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  for (let i = 0; i < n; i++) {
    input[i] = (i < closes.length ? closes[i] : closes[closes.length - 1]) - mean;
  }

  fft.realTransform(output, input);

  /* compute magnitudes (skip DC = bin 0, Nyquist = bin n/2) */
  let maxMag = 0;
  let maxBin = 0;
  for (let i = 1; i < n / 2; i++) {
    const re = output[2 * i];
    const im = output[2 * i + 1];
    const mag = re * re + im * im;
    if (mag > maxMag) {
      maxMag = mag;
      maxBin = i;
    }
  }

  if (maxBin === 0) return null;
  return n / maxBin; /* dominant period in bars */
}

export function frequencyColor(
  ohlc: OHLC[],
  _params?: IndicatorParams
): IndicatorResult {
  const closes = ohlc.map((c) => c.close);
  const period = findDominantPeriod(closes);

  if (!period || period < 3 || closes.length < period + 2) {
    return { name: "Frequency", color: "grey", value: "N/A" };
  }

  /* check price direction over last half-cycle */
  const halfPeriod = Math.max(1, Math.floor(period / 2));
  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - halfPeriod];

  if (past === 0) return { name: "Frequency", color: "grey", value: "N/A" };

  const pctChange = (current - past) / past;

  let color: "green" | "red" | "grey" = "grey";
  if (pctChange > 0.005) color = "green";
  else if (pctChange < -0.005) color = "red";

  return {
    name: "Frequency",
    color,
    value: `${Math.round(period)}d cycle`,
  };
}
