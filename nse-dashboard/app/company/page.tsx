"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface Announcement {
  id: number
  filing_time: string | null
  symbol: string
  Company_name: string
  description: string
  announcement: string
  attachment_url: string
  bucket: string | null
  magnitude: string | null
  ai_summary: string | null
  segment: string | null
}

interface Company {
  symbol: string
  Company_name: string
}

interface MarketData {
  symbol: string
  market_cap: number
  cmp: number
  pe_ratio: number
  sector: string
}

const BUCKET_CONFIG: Record<string, { icon: string; color: string; darkColor: string; label: string }> = {
  "Quarterly Results": { icon: "▣", color: "#10b981", darkColor: "#34d399", label: "Quarterly Results" },
  "Order Win":         { icon: "◈", color: "#3b82f6", darkColor: "#60a5fa", label: "Order Book" },
  "Capex Plan":        { icon: "⬡", color: "#f59e0b", darkColor: "#fbbf24", label: "Capex Plan" },
  "Dividend":          { icon: "◎", color: "#8b5cf6", darkColor: "#a78bfa", label: "Dividend" },
}

function formatMarketCap(mcap: number | null | undefined): string {
  if (!mcap || mcap <= 0) return "—"
  if (mcap >= 100000) return `₹${(mcap / 100000).toFixed(1)}L Cr`
  if (mcap >= 1000)   return `₹${Math.round(mcap).toLocaleString("en-IN")} Cr`
  return `₹${mcap.toFixed(0)} Cr`
}

function formatDate(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatDateShort(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24)  return `${hrs}h ago`
  if (days < 7)  return `${days}d ago`
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })
}

function FilingRow({ item, isDark }: { item: Announcement; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const cfg      = BUCKET_CONFIG[item.bucket || ""] || { icon: "·", color: "#6b7280", darkColor: "#9ca3af", label: item.bucket || "Other" }
  const bColor   = isDark ? cfg.darkColor : cfg.color
  const mainText = item.ai_summary || item.description
  const isAI     = !!item.ai_summary
  const cardBg     = isDark ? (expanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)") : (expanded ? "rgba(0,0,0,0.03)" : "#ffffff")
  const cardBorder = isDark ? (expanded ? `${bColor}40` : "rgba(255,255,255,0.08)") : (expanded ? `${bColor}55` : "rgba(0,0,0,0.08)")
  const metaColor  = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
  const divColor   = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"

  return (
    <div onClick={() => setExpanded(!expanded)}
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all 0.15s ease", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: bColor, borderRadius: "10px 0 0 10px", opacity: expanded ? 1 : 0.5 }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingLeft: 6 }}>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 70 }}>
          <span style={{ fontSize: 14, color: bColor }}>{cfg.icon}</span>
          <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", color: bColor, letterSpacing: 0.5, fontWeight: 700, textAlign: "center", lineHeight: 1.2, whiteSpace: "pre-line" }}>
            {cfg.label.toUpperCase().replace(" ", "\n")}
          </span>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: divColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 3 }}>
            {isAI && (
              <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", color: bColor, background: `${bColor}15`, border: `1px solid ${bColor}30`, borderRadius: 3, padding: "1px 4px", letterSpacing: 0.8, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>AI</span>
            )}
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)", lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: isAI ? 500 : 400 }}>
              {mainText}
            </div>
          </div>
          <div style={{ fontSize: 9, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>
            {formatDateShort(item.filing_time)} · {item.segment === "sme" ? "SME" : "NSE"}
            {item.magnitude === "high" && <span style={{ marginLeft: 8, color: bColor, fontWeight: 700 }}>HIGH IMPACT</span>}
          </div>
        </div>
        <span style={{ fontSize: 9, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0, transition: "transform 0.15s", transform: expanded ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${divColor}`, paddingLeft: 6, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.8, marginBottom: 3 }}>NSE FILING TYPE</div>
            <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.description}</div>
            <div style={{ fontSize: 10, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>Filed: {formatDate(item.filing_time)}</div>
          </div>
          {item.attachment_url && (
            <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 11, color: bColor, border: `1px solid ${bColor}40`, borderRadius: 6, padding: "5px 12px", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, background: `${bColor}0d`, whiteSpace: "nowrap" }}>
              VIEW PDF ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function CompanyPage() {
  const [query, setQuery]              = useState("")
  const [filings, setFilings]          = useState<Announcement[]>([])
  const [companies, setCompanies]      = useState<Company[]>([])
  const [marketData, setMarketData]    = useState<MarketData | null>(null)
  const [loading, setLoading]          = useState(false)
  const [searched, setSearched]        = useState(false)
  const [selectedCompany, setSelected] = useState<Company | null>(null)
  const [showDropdown, setDropdown]    = useState(false)
  const [isDark, setIsDark]            = useState(true)
  const debounceRef                    = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) setIsDark(saved === "dark")
  }, [])

  const fetchMarketData = useCallback(async (symbol: string) => {
    try {
      const res  = await fetch(`/api/market-data?symbols=${symbol}`)
      const data = await res.json()
      if (data[symbol]) setMarketData(data[symbol])
    } catch (e) { console.error(e) }
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setCompanies([]); setDropdown(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/company-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.companies) setCompanies(data.companies)
      if (data.filings)   { setFilings(data.filings); setSearched(true) }
      setDropdown(data.companies?.length > 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    setSelected(null)
    setMarketData(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  function selectCompany(company: Company) {
    setSelected(company)
    setQuery(company.Company_name)
    setDropdown(false)
    search(company.symbol)
    fetchMarketData(company.symbol)
  }

  const grouped = filings.reduce((acc, f) => {
    const key = f.bucket || "Other"
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {} as Record<string, Announcement[]>)

  const bucketOrder    = ["Quarterly Results", "Order Win", "Capex Plan", "Dividend"]
  const sortedBuckets  = [
    ...bucketOrder.filter((b) => grouped[b]?.length > 0),
    ...Object.keys(grouped).filter((b) => !bucketOrder.includes(b) && grouped[b]?.length > 0),
  ]

  const companyName = selectedCompany?.Company_name || (filings[0]?.Company_name ?? "")
  const symbol      = selectedCompany?.symbol || (filings[0]?.symbol ?? "")

  const bg           = isDark ? "#0a0d12"                : "#f8fafc"
  const headerBg     = isDark ? "rgba(10,13,18,0.92)"   : "rgba(248,250,252,0.92)"
  const headerBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const titleColor   = isDark ? "#f1f5f9"                : "#0f172a"
  const subColor     = isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.4)"
  const inputBg      = isDark ? "rgba(255,255,255,0.05)" : "#ffffff"
  const inputBorder  = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"
  const dropBg       = isDark ? "#141820"                : "#ffffff"
  const dropBorder   = isDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)"
  const footerColor  = isDark ? "rgba(255,255,255,0.2)"  : "rgba(0,0,0,0.25)"
  const footerBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"
  const metaCardBg   = isDark ? "rgba(255,255,255,0.03)" : "#ffffff"
  const metaCardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}; border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .drop-item:hover { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"} !important; }
        .filing-row:hover { background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"} !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: bg, color: isDark ? "#e2e8f0" : "#1e293b", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {isDark && <div style={{ position: "fixed", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />}

        {/* HEADER */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${headerBorder}`, background: headerBg, backdropFilter: "blur(24px)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #10b981, #3b82f6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 900 }}>▣</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: titleColor }}>InsightInvest</span>
            </a>
            <div style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace" }}>/ COMPANY SEARCH</div>
            <div style={{ flex: 1 }} />
            <button onClick={() => { const next = !isDark; setIsDark(next); localStorage.setItem("theme", next ? "dark" : "light") }}
              style={{ background: "none", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: subColor, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>
              {isDark ? "☀ LIGHT" : "☽ DARK"}
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 28px 80px", position: "relative", zIndex: 1 }}>

          {/* PAGE TITLE */}
          <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeUp 0.3s both" }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: titleColor, marginBottom: 8 }}>
              Company Intelligence
            </h1>
            <p style={{ fontSize: 12, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
              SEARCH ANY NSE COMPANY · SEE ALL FILINGS IN ONE PLACE
            </p>
          </div>

          {/* SEARCH BOX */}
          <div style={{ position: "relative", marginBottom: 40, animation: "fadeUp 0.3s 0.05s both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: "14px 20px", boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>
              {loading ? (
                <div style={{ width: 16, height: 16, borderTop: "2px solid #10b981", borderRight: "2px solid transparent", borderBottom: "2px solid transparent", borderLeft: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              ) : (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"} strokeWidth={2} style={{ flexShrink: 0 }}>
                  <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
                </svg>
              )}
              <input
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                onFocus={() => companies.length > 0 && setDropdown(true)}
                onBlur={() => setTimeout(() => setDropdown(false), 150)}
                placeholder="Search company name or symbol… e.g. DIXON, Tata Power"
                style={{ background: "none", border: "none", outline: "none", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 15, width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setFilings([]); setCompanies([]); setSearched(false); setSelected(null); setMarketData(null) }}
                  style={{ background: "none", border: "none", color: subColor, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
              )}
            </div>

            {/* AUTOCOMPLETE */}
            {showDropdown && companies.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: dropBg, border: `1px solid ${dropBorder}`, borderRadius: 10, overflow: "hidden", boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50 }}>
                {companies.map((c) => (
                  <div key={c.symbol} className="drop-item"
                    onClick={() => selectCompany(c)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", transition: "background 0.1s" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#10b981", minWidth: 80, letterSpacing: 0.5 }}>{c.symbol}</div>
                    <div style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.Company_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EMPTY STATE */}
          {!searched && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeUp 0.3s 0.1s both" }}>
              <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.3 }}>◈</div>
              <div style={{ fontSize: 13, color: subColor, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Search for any NSE listed company</div>
              <div style={{ fontSize: 11, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5, opacity: 0.7 }}>QUARTERLY RESULTS · ORDER WINS · CAPEX · DIVIDENDS</div>
            </div>
          )}

          {searched && filings.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◇</div>
              <div style={{ fontSize: 13, color: subColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No signal filings found for "{query}"</div>
              <div style={{ fontSize: 11, color: subColor, marginTop: 6, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>Try the stock symbol e.g. DIXON, CDSL</div>
            </div>
          )}

          {/* RESULTS */}
          {searched && filings.length > 0 && (
            <div style={{ animation: "fadeUp 0.3s both" }}>

              {/* COMPANY HEADER */}
              <div style={{ marginBottom: 24, padding: "20px 24px", background: metaCardBg, border: `1px solid ${metaCardBorder}`, borderRadius: 14, boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Logo */}
                  <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #10b981, #3b82f6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                    {symbol.slice(0, 2)}
                  </div>

                  {/* Name + symbol */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: titleColor, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: -0.3, marginBottom: 4 }}>
                      {companyName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#10b981", fontWeight: 700, letterSpacing: 0.5 }}>{symbol}</span>
                      <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace" }}>·</span>
                      <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>{filings.length} FILINGS · JAN 2026 → TODAY</span>
                      {marketData?.sector && (
                        <>
                          <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace" }}>·</span>
                          <span style={{ fontSize: 10, color: subColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{marketData.sector}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Market data */}
                  {marketData && (
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {marketData.market_cap > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 8, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.8, marginBottom: 3 }}>Mkt Cap</div>
                          <div style={{ fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: titleColor, letterSpacing: -0.5 }}>
                            {formatMarketCap(marketData.market_cap)}
                          </div>
                        </div>
                      )}
                      {marketData.cmp > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 8, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.8, marginBottom: 3 }}>CMP</div>
                          <div style={{ fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: titleColor, letterSpacing: -0.5 }}>
                            ₹{marketData.cmp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                      {marketData.pe_ratio > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 8, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.8, marginBottom: 3 }}>P/E</div>
                          <div style={{ fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: titleColor, letterSpacing: -0.5 }}>
                            {marketData.pe_ratio.toFixed(1)}x
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bucket summary pills */}
                {sortedBuckets.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                    {sortedBuckets.map((bucket) => {
                      const cfg = BUCKET_CONFIG[bucket]
                      if (!cfg) return null
                      const bc = isDark ? cfg.darkColor : cfg.color
                      return (
                        <div key={bucket} style={{ display: "flex", alignItems: "center", gap: 5, background: `${bc}12`, border: `1px solid ${bc}28`, borderRadius: 6, padding: "4px 10px" }}>
                          <span style={{ fontSize: 11, color: bc }}>{cfg.icon}</span>
                          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: bc, fontWeight: 700, letterSpacing: 0.3 }}>{cfg.label}</span>
                          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: bc, opacity: 0.7 }}>({grouped[bucket].length})</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* GROUPED FILINGS */}
              {sortedBuckets.map((bucket) => {
                const cfg   = BUCKET_CONFIG[bucket]
                const items = grouped[bucket]
                if (!items?.length) return null
                const bc = cfg ? (isDark ? cfg.darkColor : cfg.color) : "#6b7280"
                return (
                  <div key={bucket} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 14, color: bc }}>{cfg?.icon}</span>
                      <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: bc, fontWeight: 700, letterSpacing: 0.8 }}>
                        {cfg?.label.toUpperCase() || bucket.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace" }}>({items.length})</span>
                      <div style={{ flex: 1, height: 1, background: `${bc}25` }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {items.map((item) => (
                        <div key={item.id} className="filing-row" style={{ borderRadius: 10 }}>
                          <FilingRow item={item} isDark={isDark} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 18, borderTop: `1px solid ${footerBorder}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 10, color: footerColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>DATA: NSE INDIA · AI: CLAUDE · JAN 2026 → PRESENT</span>
            <span style={{ fontSize: 10, color: footerColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>NOT SEBI REGISTERED · NOT INVESTMENT ADVICE</span>
          </div>
        </main>
      </div>
    </>
  )
}
