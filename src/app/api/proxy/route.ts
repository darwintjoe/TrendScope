import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("t");
  const range = req.nextUrl.searchParams.get("range") || "1y";
  const interval = req.nextUrl.searchParams.get("interval") || "1d";

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param ?t=" }, { status: 400 });
  }

  const yahooUrl =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?range=${range}&interval=${interval}&includePrePost=false`;

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "No chart result", raw: data }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const meta = result.meta ?? {};

    const isIntraday = interval !== "1d" && interval !== "1wk" && interval !== "1mo";

    const ohlc = timestamps
      .map((ts: number, i: number) => {
        const dt = new Date(ts * 1000);
        const dateStr = isIntraday
          ? dt.toISOString().replace("T", " ").slice(0, 16)
          : dt.toISOString().split("T")[0];
        return {
          date: dateStr,
          open: round(quote.open?.[i]),
          high: round(quote.high?.[i]),
          low: round(quote.low?.[i]),
          close: round(quote.close?.[i]),
          volume: Math.round(quote.volume?.[i] ?? 0),
        };
      })
      .filter(
        (c: { open: number; close: number }) => c.open > 0 && c.close > 0
      );

    return NextResponse.json({
      ohlc,
      meta: {
        symbol: meta.symbol,
        shortName: meta.shortName,
        longName: meta.longName,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        fullExchangeName: meta.fullExchangeName,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        regularMarketDayHigh: meta.regularMarketDayHigh,
        regularMarketDayLow: meta.regularMarketDayLow,
        regularMarketVolume: meta.regularMarketVolume,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Proxy fetch failed", detail: String(err) },
      { status: 500 }
    );
  }
}

function round(v: number | undefined | null): number {
  if (v == null || isNaN(v)) return 0;
  return Math.round(v * 100) / 100;
}
