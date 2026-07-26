import { NextRequest, NextResponse } from "next/server";

function extractValue(html: string, key: string): number | null {
  const pattern = new RegExp(`"${key}":\\s*\\{[^}]*"raw":\\s*([0-9.eE+-]+)`);
  const match = html.match(pattern);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  }
  return null;
}

async function fetchFundamentals(ticker: string) {
  try {
    const res = await fetch(`https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const html = await res.text();

    return {
      pbv: extractValue(html, "priceToBook"),
      per: extractValue(html, "trailingPE"),
      eps: extractValue(html, "trailingEps"),
      forwardPE: extractValue(html, "forwardPE"),
      dividendYield: extractValue(html, "dividendYield"),
      marketCap: extractValue(html, "marketCap"),
      bookValue: extractValue(html, "bookValue"),
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const tickerParam = req.nextUrl.searchParams.get("t");

  if (!tickerParam) {
    return NextResponse.json({ error: "Missing ticker param ?t=" }, { status: 400 });
  }

  const tickers = tickerParam.split(",").map((t) => t.trim()).filter(Boolean);

  try {
    /* fetch all in parallel */
    const results = await Promise.all(
      tickers.map(async (ticker) => {
        const data = await fetchFundamentals(ticker);
        return { ticker, data };
      })
    );

    const result: Record<string, Record<string, number | null>> = {};
    for (const r of results) {
      if (r.data) {
        result[r.ticker] = r.data;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Fundamentals fetch failed", detail: String(err) },
      { status: 500 }
    );
  }
}
