"use client";

import { useRef, useEffect } from "react";
import { OHLC } from "@/lib/provider/types";

interface ChartProps {
  ohlc: OHLC[];
  height?: number;
}

/**
 * Lightweight canvas candlestick chart — no external deps.
 * Renders green/red candles + volume bars at bottom.
 */
export function CandlestickChart({ ohlc, height = 220 }: ChartProps) {
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

    const W = rect.width;
    const H = height;
    const PAD = { top: 8, right: 48, bottom: 28, left: 4 };
    const VOL_H = 30;
    const chartH = H - PAD.top - PAD.bottom - VOL_H;

    /* price range */
    let minP = Infinity, maxP = -Infinity, maxVol = 0;
    for (const c of ohlc) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }
    const pRange = maxP - minP || 1;
    const pPad = pRange * 0.05;
    minP -= pPad;
    maxP += pPad;
    const totalRange = maxP - minP;

    const candleW = Math.max(1, (W - PAD.left - PAD.right) / ohlc.length * 0.7);
    const gap = (W - PAD.left - PAD.right) / ohlc.length;

    const yOf = (p: number) => PAD.top + chartH - ((p - minP) / totalRange) * chartH;
    const xOf = (i: number) => PAD.left + i * gap + gap / 2;

    /* background */
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, W, H);

    /* grid lines (5 horizontal) */
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();

      /* price label */
      const pVal = maxP - (totalRange / 4) * i;
      ctx.fillStyle = "#71717a";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(pVal.toFixed(1), W - PAD.right + 4, y + 3);
    }

    /* candles */
    for (let i = 0; i < ohlc.length; i++) {
      const c = ohlc[i];
      const x = xOf(i);
      const isUp = c.close >= c.open;
      const color = isUp ? "#22c55e" : "#ef4444";

      /* wick */
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yOf(c.high));
      ctx.lineTo(x, yOf(c.low));
      ctx.stroke();

      /* body */
      const bodyTop = yOf(Math.max(c.open, c.close));
      const bodyBot = yOf(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }

    /* volume bars */
    const volBase = H - PAD.bottom;
    const volMaxH = VOL_H - 4;
    for (let i = 0; i < ohlc.length; i++) {
      const c = ohlc[i];
      const x = xOf(i);
      const vH = maxVol > 0 ? (c.volume / maxVol) * volMaxH : 0;
      const isUp = c.close >= c.open;
      ctx.fillStyle = isUp ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
      ctx.fillRect(x - candleW / 2, volBase - vH, candleW, vH);
    }

    /* date labels */
    ctx.fillStyle = "#52525b";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    const labelStep = Math.max(1, Math.floor(ohlc.length / 5));
    for (let i = 0; i < ohlc.length; i += labelStep) {
      const d = ohlc[i].date;
      const label = d.length > 10 ? d.slice(5, 10) : d.slice(5);
      ctx.fillText(label, xOf(i), H - 6);
    }

    /* last price line */
    const last = ohlc[ohlc.length - 1];
    const lastY = yOf(last.close);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, lastY);
    ctx.lineTo(W - PAD.right, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    /* last price label */
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(last.close.toFixed(1), W - PAD.right + 4, lastY + 3);

  }, [ohlc, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
}
