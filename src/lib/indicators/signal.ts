import { OHLC, IndicatorResult, IndicatorParams } from "../provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = (typeof window !== "undefined" ? require("technicalindicators") : null);

const DEFAULTS: IndicatorParams = {
  emaFast: 50,
  emaSlow: 200,
  adxPeriod: 14,
  adxThreshold: 25,
  cmfPeriod: 20,
  cmfThreshold: 0.05,
  bbPeriod: 20,
  bbStdDev: 2.0,
  volumeAvgPeriod: 50,
  volumeThreshold: 1.5,
  alligatorJaw: 13,
  alligatorTeeth: 8,
  alligatorLips: 5,
  jawShift: 8,
  teethShift: 5,
  lipsShift: 3,
};

/**
 * Signal Triangle — "Pull The Trigger" marker.
 * Only prints when ALL rules agree.
 *
 * Green: BUY signal (all bullish conditions met)
 * Red:   SELL signal (all bearish conditions met)
 * Grey:  No signal
 *
 * BUY requires:
 * 1. Trend: EMA50 > EMA200, ADX > 25, MACD > 0, Price > VWAP
 * 2. Money: OBV rising, CMF > 0.05
 * 3. Volatility: BB Squeeze occurred
 * 4. Trigger: Close > Upper BB, Volume > 1.5x, Alligator aligned
 *
 * SELL requires:
 * 1. Trend: EMA50 < EMA200, MACD < 0
 * 2. Money: OBV falling, CMF < -0.05, high volume red candle
 * 3. Trigger: Close < Last Swing Low, Volume > 1.5x
 */
export function signalIndicator(
  ohlc: OHLC[],
  params?: IndicatorParams
): IndicatorResult {
  if (!TI) return { name: "Signal", color: "grey", value: "N/A" };

  const p = { ...DEFAULTS, ...params };

  if (ohlc.length < Math.max(p.emaSlow, 200, 120)) {
    return { name: "Signal", color: "grey", value: "N/A" };
  }

  try {
    const closes = ohlc.map((c) => c.close);
    const current = ohlc[ohlc.length - 1];
    const prev = ohlc[ohlc.length - 2];

    // === TREND CHECKS ===
    // EMA 50/200
    const emaFastRaw = TI.EMA.calculate({ values: closes, period: p.emaFast });
    const emaSlowRaw = TI.EMA.calculate({ values: closes, period: p.emaSlow });
    if (!emaFastRaw.length || !emaSlowRaw.length) {
      return { name: "Signal", color: "grey", value: "N/A" };
    }
    const ema50 = emaFastRaw[emaFastRaw.length - 1];
    const ema200 = emaSlowRaw[emaSlowRaw.length - 1];
    const emaBullish = ema50 > ema200;
    const emaBearish = ema50 < ema200;

    // ADX
    const highs = ohlc.map((c) => c.high);
    const lows = ohlc.map((c) => c.low);
    const adxResult = TI.ADX.calculate({ high: highs, low: lows, close: closes, period: p.adxPeriod });
    const adx = adxResult && adxResult.length > 0 ? adxResult[adxResult.length - 1] : 0;
    const adxBullish = adx > p.adxThreshold;

    // MACD
    const macdResult = TI.MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    });
    const macd = macdResult && macdResult.length > 0 ? macdResult[macdResult.length - 1] : null;
    const macdBullish = macd && macd.MACD > 0;
    const macdBearish = macd && macd.MACD < 0;

    // VWAP
    let cumVol = 0;
    let cumTP = 0;
    for (const bar of ohlc) {
      const tp = (bar.high + bar.low + bar.close) / 3;
      cumTP += tp * bar.volume;
      cumVol += bar.volume;
    }
    const vwap = cumVol > 0 ? cumTP / cumVol : current.close;
    const vwapBullish = current.close > vwap;

    // Alligator alignment
    const jawRaw = TI.WEMA.calculate({ values: closes, period: p.alligatorJaw });
    const teethRaw = TI.WEMA.calculate({ values: closes, period: p.alligatorTeeth });
    const lipsRaw = TI.WEMA.calculate({ values: closes, period: p.alligatorLips });

    let alligatorBullish = false;
    let alligatorBearish = false;

    if (jawRaw.length > p.jawShift && teethRaw.length > p.teethShift && lipsRaw.length > p.lipsShift) {
      const jaw = jawRaw[jawRaw.length - 1 - p.jawShift];
      const teeth = teethRaw[teethRaw.length - 1 - p.teethShift];
      const lips = lipsRaw[lipsRaw.length - 1 - p.lipsShift];
      alligatorBullish = current.close > lips && lips > teeth && teeth > jaw;
      alligatorBearish = current.close < lips && lips < teeth && teeth < jaw;
    }

    // === MONEY CHECKS ===
    // OBV
    let obv = 0;
    const obvValues: number[] = [];
    for (let i = 0; i < ohlc.length; i++) {
      if (i === 0) { obvValues.push(0); continue; }
      if (ohlc[i].close > ohlc[i - 1].close) obv += ohlc[i].volume;
      else if (ohlc[i].close < ohlc[i - 1].close) obv -= ohlc[i].volume;
      obvValues.push(obv);
    }
    const currentOBV = obvValues[obvValues.length - 1];
    const pastOBV = obvValues[obvValues.length - 1 - 20];
    const obvRising = currentOBV > pastOBV;
    const obvFalling = currentOBV < pastOBV;

    // CMF
    const cmfSlice = ohlc.slice(-p.cmfPeriod);
    let sumMFV = 0;
    let sumVol = 0;
    for (const bar of cmfSlice) {
      const hl = bar.high - bar.low;
      if (hl === 0) continue;
      const mfm = (bar.close - bar.low - (bar.high - bar.close)) / hl;
      sumMFV += mfm * bar.volume;
      sumVol += bar.volume;
    }
    const cmf = sumVol > 0 ? sumMFV / sumVol : 0;
    const cmfBullish = cmf > p.cmfThreshold;
    const cmfBearish = cmf < -p.cmfThreshold;

    // Volume
    const volSlice = ohlc.slice(-p.volumeAvgPeriod - 1, -1);
    const avgVol = volSlice.reduce((s, c) => s + c.volume, 0) / volSlice.length;
    const volRatio = avgVol > 0 ? current.volume / avgVol : 0;
    const highVolume = volRatio > p.volumeThreshold;
    const highVolRed = highVolume && current.close < current.open;

    // === VOLATILITY CHECKS ===
    // BB Squeeze
    const bbWidths: number[] = [];
    for (let i = p.bbPeriod - 1; i < ohlc.length; i++) {
      const s = ohlc.slice(i - p.bbPeriod + 1, i + 1);
      const closesBB = s.map((c) => c.close);
      const mean = closesBB.reduce((a, b) => a + b, 0) / closesBB.length;
      const variance = closesBB.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closesBB.length;
      const stdDev = Math.sqrt(variance);
      const upper = mean + p.bbStdDev * stdDev;
      const lower = mean - p.bbStdDev * stdDev;
      const width = mean !== 0 ? ((upper - lower) / mean) * 100 : 0;
      bbWidths.push(width);
    }
    const isSqueeze = bbWidths.length >= 120 &&
      bbWidths[bbWidths.length - 1] <= Math.min(...bbWidths.slice(-120)) * 1.001;

    // Upper BB for breakout check
    const bbSlice = ohlc.slice(-p.bbPeriod);
    const closesBB = bbSlice.map((c) => c.close);
    const bbMean = closesBB.reduce((a, b) => a + b, 0) / closesBB.length;
    const bbVariance = closesBB.reduce((a, b) => a + Math.pow(b - bbMean, 2), 0) / closesBB.length;
    const bbStdDev = Math.sqrt(bbVariance);
    const upperBB = bbMean + p.bbStdDev * bbStdDev;

    // Last swing low
    const swingSlice = ohlc.slice(-10);
    const lastSwingLow = Math.min(...swingSlice.map((c) => c.low));

    // === TRIGGER CHECKS ===
    const longBreakout = current.close > upperBB;
    const shortBreakdown = current.close < lastSwingLow;

    // === EVALUATE BUY SIGNAL ===
    const buyTrend = emaBullish && adxBullish && macdBullish && vwapBullish;
    const buyMoney = obvRising && cmfBullish;
    const buyVolatility = isSqueeze;
    const buyTrigger = longBreakout && highVolume && alligatorBullish;
    const buySignal = buyTrend && buyMoney && buyVolatility && buyTrigger;

    // === EVALUATE SELL SIGNAL ===
    const sellTrend = emaBearish && macdBearish;
    const sellMoney = obvFalling && cmfBearish && highVolRed;
    const sellTrigger = shortBreakdown && highVolume;
    const sellSignal = sellTrend && sellMoney && sellTrigger;

    if (buySignal) {
      return { name: "Signal", color: "green", value: "BUY" };
    } else if (sellSignal) {
      return { name: "Signal", color: "red", value: "SELL" };
    }

    return { name: "Signal", color: "grey", value: "—" };
  } catch {
    return { name: "Signal", color: "grey", value: "err" };
  }
}
