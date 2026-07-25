"use client";

import { useRef, useEffect } from "react";
import { OHLC } from "@/lib/provider/types";

/* eslint-disable @typescript-eslint/no-require-imports */
const TI = typeof window !== "undefined" ? require("technicalindicators") : null;

interface IndicatorChartProps {
  name: string;
  ohlc: OHLC[];
  height?: number;
}

function drawMACD(ctx: CanvasRenderingContext2D, ohlc: OHLC[], W: number, H: number) {
  const closes = ohlc.map((c) => c.close);
  const result = TI.MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  if (result.length < 2) return;

  const PAD = { top: 10, right: 48, bottom: 16, left: 4 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const histValues = result.map((r: { MACD: number; signal: number }) => r.MACD - r.signal);
  const macdLine = result.map((r: { MACD: number }) => r.MACD);
  const signalLine = result.map((r: { signal: number }) => r.signal);

  const allVals = [...histValues, ...macdLine, ...signalLine];
  let minV = Math.min(...allVals);
  let maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  minV -= range * 0.1;
  maxV += range * 0.1;
  const totalRange = maxV - minV;

  const gap = chartW / (result.length - 1 || 1);
  const yOf = (v: number) => PAD.top + chartH - ((v - minV) / totalRange) * chartH;
  const xOf = (i: number) => PAD.left + i * gap;

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 0.5;
  const zeroY = yOf(0);
  ctx.beginPath();
  ctx.moveTo(PAD.left, zeroY);
  ctx.lineTo(W - PAD.right, zeroY);
  ctx.stroke();

  const barW = Math.max(1, gap * 0.6);
  for (let i = 0; i < histValues.length; i++) {
    const v = histValues[i];
    const x = xOf(i);
    const y = yOf(v);
    ctx.fillStyle = v >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)";
    ctx.fillRect(x - barW / 2, Math.min(y, zeroY), barW, Math.abs(y - zeroY));
  }

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < macdLine.length; i++) {
    const x = xOf(i);
    const y = yOf(macdLine[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#f59e0b";
  ctx.beginPath();
  for (let i = 0; i < signalLine.length; i++) {
    const x = xOf(i);
    const y = yOf(signalLine[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText(maxV.toFixed(2), W - PAD.right + 4, PAD.top + 8);
  ctx.fillText(minV.toFixed(2), W - PAD.right + 4, H - PAD.bottom);
  ctx.fillText("MACD", PAD.left + 2, PAD.top + 8);
}

function drawRSI(ctx: CanvasRenderingContext2D, ohlc: OHLC[], W: number, H: number) {
  const closes = ohlc.map((c) => c.close);
  const result = TI.RSI.calculate({ values: closes, period: 14 });
  if (result.length < 2) return;

  const PAD = { top: 10, right: 48, bottom: 16, left: 4 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const gap = chartW / (result.length - 1 || 1);
  const yOf = (v: number) => PAD.top + chartH - ((v - 0) / 100) * chartH;
  const xOf = (i: number) => PAD.left + i * gap;

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 0.5;
  for (const level of [30, 50, 70]) {
    const y = yOf(level);
    ctx.beginPath();
    ctx.setLineDash(level === 50 ? [] : [3, 3]);
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(239,68,68,0.1)";
  ctx.fillRect(PAD.left, yOf(100), chartW, yOf(70) - yOf(100));
  ctx.fillStyle = "rgba(34,197,94,0.1)";
  ctx.fillRect(PAD.left, yOf(30), chartW, yOf(0) - yOf(30));

  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < result.length; i++) {
    const x = xOf(i);
    const y = yOf(result[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText("100", W - PAD.right + 4, yOf(100) + 3);
  ctx.fillText("70", W - PAD.right + 4, yOf(70) + 3);
  ctx.fillText("50", W - PAD.right + 4, yOf(50) + 3);
  ctx.fillText("30", W - PAD.right + 4, yOf(30) + 3);
  ctx.fillText("0", W - PAD.right + 4, yOf(0) + 3);
  ctx.fillText("RSI", PAD.left + 2, PAD.top + 8);
}

function drawStochastic(ctx: CanvasRenderingContext2D, ohlc: OHLC[], W: number, H: number) {
  const highs = ohlc.map((c) => c.high);
  const lows = ohlc.map((c) => c.low);
  const closes = ohlc.map((c) => c.close);
  const result = TI.Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });
  if (result.length < 2) return;

  const PAD = { top: 10, right: 48, bottom: 16, left: 4 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const gap = chartW / (result.length - 1 || 1);
  const yOf = (v: number) => PAD.top + chartH - ((v - 0) / 100) * chartH;
  const xOf = (i: number) => PAD.left + i * gap;

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 0.5;
  for (const level of [20, 50, 80]) {
    const y = yOf(level);
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(239,68,68,0.1)";
  ctx.fillRect(PAD.left, yOf(100), chartW, yOf(80) - yOf(100));
  ctx.fillStyle = "rgba(34,197,94,0.1)";
  ctx.fillRect(PAD.left, yOf(20), chartW, yOf(0) - yOf(20));

  ctx.strokeStyle = "#06b6d4";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < result.length; i++) {
    const x = xOf(i);
    const y = yOf(result[i].k);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < result.length; i++) {
    const x = xOf(i);
    const y = yOf(result[i].d);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = "#71717a";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText("100", W - PAD.right + 4, yOf(100) + 3);
  ctx.fillText("80", W - PAD.right + 4, yOf(80) + 3);
  ctx.fillText("20", W - PAD.right + 4, yOf(20) + 3);
  ctx.fillText("0", W - PAD.right + 4, yOf(0) + 3);
  ctx.fillText("Stoch", PAD.left + 2, PAD.top + 8);
}

function drawCMF(ctx: CanvasRenderingContext2D, ohlc: OHLC[], W: number, H: number) {
  const period = 20;
  const result: number[] = [];

  for (let i = 0; i < ohlc.length; i++) {
    if (i < period - 1) {
      result.push(0);
      continue;
    }
    let mfvSum = 0;
    let volSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const c = ohlc[j];
      const hl = c.high - c.low;
      const mfv = hl > 0 ? ((c.close - c.low) - (c.high - c.close)) / hl * c.volume : 0;
      mfvSum += mfv;
      volSum += c.volume;
    }
    result.push(volSum > 0 ? mfvSum / volSum : 0);
  }

  if (result.length < 2) return;

  const PAD = { top: 10, right: 48, bottom: 16, left: 4 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  let minV = Math.min(...result);
  let maxV = Math.max(...result);
  const range = maxV - minV || 0.1;
  minV -= range * 0.1;
  maxV += range * 0.1;
  const totalRange = maxV - minV;

  const gap = chartW / (result.length - 1 || 1);
  const barW = Math.max(1, gap * 0.7);
  const yOf = (v: number) => PAD.top + chartH - ((v - minV) / totalRange) * chartH;
  const xOf = (i: number) => PAD.left + i * gap;

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, W, H);

  const zeroY = yOf(0);
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PAD.left, zeroY);
  ctx.lineTo(W - PAD.right, zeroY);
  ctx.stroke();

  for (let i = 0; i < result.length; i++) {
    const v = result[i];
    const x = xOf(i);
    const y = yOf(v);
    ctx.fillStyle = v >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)";
    ctx.fillRect(x - barW / 2, Math.min(y, zeroY), barW, Math.abs(y - zeroY));
  }

  ctx.fillStyle = "#71717a";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText(maxV.toFixed(3), W - PAD.right + 4, PAD.top + 8);
  ctx.fillText(minV.toFixed(3), W - PAD.right + 4, H - PAD.bottom);
  ctx.fillText("CMF", PAD.left + 2, PAD.top + 8);
}

const CHART_FNS: Record<string, (ctx: CanvasRenderingContext2D, ohlc: OHLC[], W: number, H: number) => void> = {
  MACD: drawMACD,
  RSI: drawRSI,
  Stochastic: drawStochastic,
  CMF: drawCMF,
};

export const CHARTABLE_INDICATORS = Object.keys(CHART_FNS);

export function IndicatorChart({ name, ohlc, height = 80 }: IndicatorChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ohlc.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const draw = CHART_FNS[name];
    if (draw) draw(ctx, ohlc, rect.width, height);
  }, [name, ohlc, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded"
      style={{ height: `${height}px` }}
    />
  );
}
