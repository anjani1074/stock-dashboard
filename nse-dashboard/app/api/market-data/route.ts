import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Fetch quote from NSE ─────────────────────────────────────────────────────
async function fetchNSEQuote(symbol: string, cookies: string) {
  try {
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com/",
        "Cookie": cookies,
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()

    const info      = data?.info || {}
    const priceInfo = data?.priceInfo || {}
    const metadata  = data?.metadata || {}

    const cmp        = parseFloat(priceInfo?.lastPrice || priceInfo?.close || 0)
    const issuedSize = parseFloat(metadata?.issuedSize || info?.issuedSize || 0)
    const pe         = parseFloat(metadata?.pdSymbolPe || metadata?.pdSectorPe || 0)
    const sector     = info?.industry || info?.sector || metadata?.industry || ""

    // Market Cap = CMP × Total Shares / 10,000,000 (to get Crores)
    const marketCap = (cmp > 0 && issuedSize > 0)
      ? Math.round((cmp * issuedSize) / 10000000)
      : 0

    if (!cmp) return null

    return {
      symbol,
      company_name: info?.companyName || info?.longName || symbol,
      market_cap:   marketCap,
      cmp,
      pe_ratio:     pe,
      sector,
      last_updated: new Date().toISOString(),
    }
  } catch (e) {
    console.error(`NSE Quote error [${symbol}]:`, e)
    return null
  }
}

// ─── GET /api/market-data?symbols=TCS,INFY,DIXON ─────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get("symbols")
    const refresh      = searchParams.get("refresh") === "true"
    const debugMode    = searchParams.get("debug") === "true"

    if (!symbolsParam) return Response.json({})

    const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    if (symbols.length === 0) return Response.json({})

    // ── Debug mode: return raw NSE response ──────────────────────────────────
    if (debugMode && symbols.length === 1) {
      const homeRes = await fetch("https://www.nseindia.com", {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" },
      })
      const cookies = homeRes.headers.get("set-cookie") || ""
      const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbols[0]}`
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
          "Referer": "https://www.nseindia.com/",
          "Cookie": cookies,
        },
      })
      const raw = await res.json()
      return Response.json(raw)
    }

    // ── Check Supabase cache ─────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("company_metadata")
      .select("*")
      .in("symbol", symbols)

    const cachedMap: Record<string, any> = {}
    const staleSymbols: string[] = []
    const now = new Date()

    for (const row of cached ?? []) {
      const updatedAt = new Date(row.last_updated)
      const hoursOld  = (now.getTime() - updatedAt.getTime()) / 3600000
      if (!refresh && hoursOld < 24) {
        cachedMap[row.symbol] = row
      } else {
        staleSymbols.push(row.symbol)
      }
    }

    // Find symbols not in cache
    const cachedSymbols  = new Set(Object.keys(cachedMap))
    const missingSymbols = symbols.filter((s) => !cachedSymbols.has(s))
    const toFetch        = [...new Set([...missingSymbols, ...staleSymbols])]

    // ── Fetch missing/stale from NSE ─────────────────────────────────────────
    if (toFetch.length > 0) {
      const homeRes = await fetch("https://www.nseindia.com", {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" },
      })
      const cookies = homeRes.headers.get("set-cookie") || ""

      for (let i = 0; i < toFetch.length; i++) {
        const symbol = toFetch[i]
        const quote  = await fetchNSEQuote(symbol, cookies)

        if (quote) {
          await supabase
            .from("company_metadata")
            .upsert(quote, { onConflict: "symbol" })
          cachedMap[symbol] = quote
        }

        if (i < toFetch.length - 1) {
          await new Promise((r) => setTimeout(r, 300))
        }
      }
    }

    return Response.json(cachedMap)

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
