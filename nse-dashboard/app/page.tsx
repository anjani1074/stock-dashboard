"use client"

import { useEffect, useState, useCallback } from "react"

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
}

const BUCKETS = [
  { id: "Quarterly Results", label: "Quarterly Results", icon: "◆", color: "#00a875", darkColor: "#00e5a0", border: "rgba(0,168,117,0.35)", darkBorder: "rgba(0,229,160,0.3)", bg: "rgba(0,168,117,0.08)", darkBg: "rgba(0,229,160,0.08)", description: "Q3 FY26 financial results filings" },
  { id: "Order Win",         label: "Order Book",        icon: "▲", color: "#0284c7", darkColor: "#4fc3f7", border: "rgba(2,132,199,0.35)",   darkBorder: "rgba(79,195,247,0.3)",  bg: "rgba(2,132,199,0.07)",   darkBg: "rgba(79,195,247,0.08)",  description: "New contracts & work orders" },
  { id: "Capex Plan",        label: "Capex Plans",       icon: "⬡", color: "#b45309", darkColor: "#ffd54f", border: "rgba(180,83,9,0.35)",    darkBorder: "rgba(255,213,79,0.3)",  bg: "rgba(180,83,9,0.07)",    darkBg: "rgba(255,213,79,0.08)",  description: "Capacity expansion & investments" },
  { id: "Dividend",          label: "Dividends",         icon: "◎", color: "#7c3aed", darkColor: "#ce93d8", border: "rgba(124,58,237,0.35)",  darkBorder: "rgba(206,147,216,0.3)", bg: "rgba(124,58,237,0.07)",  darkBg: "rgba(206,147,216,0.08)", description: "Dividend declarations" },
]

const SIGNAL_BUCKETS = BUCKETS.map((b) => b.id)

function formatDate(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function timeAgo(d: string | null) {
  if (!d) return ""
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function MagnitudeDot({ magnitude }: { magnitude: string | null }) {
  const color = magnitude === "high" ? "#00c87a" : magnitude === "medium" ? "#f59e0b" : "#9ca3af"
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: magnitude === "high" ? `0 0 8px ${color}` : "none", flexShrink: 0 }} />
  )
}

function FilingCard({ item, bucketColor, isDark }: { item: Announcement; bucketColor: string; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const cardBg        = isDark ? (expanded ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)") : (expanded ? "rgba(0,0,0,0.04)" : "#ffffff")
  const cardBorder    = isDark ? (expanded ? bucketColor + "55" : "rgba(255,255,255,0.12)") : (expanded ? bucketColor + "66" : "rgba(0,0,0,0.1)")
  const nameColor     = isDark ? "#f0f4f8" : "#111827"
  const summaryColor  = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)"
  const fallbackColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"
  const metaColor     = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"
  const divColor      = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"
  const expandBg      = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
  const mainText      = item.ai_summary || item.description
  const isAI          = !!item.ai_summary

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all 0.18s ease", boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Symbol */}
        <div style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", border: `1px solid ${bucketColor}44`, borderRadius: 8, padding: "8px 12px", minWidth: 94, textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: bucketColor, letterSpacing: 0.5 }}>{item.symbol}</div>
          <div style={{ fontSize: 10, color: metaColor, marginTop: 3 }}>NSE</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: nameColor, lineHeight: 1.4, marginBottom: 6, fontFamily: "'Manrope', sans-serif" }}>
            {item.Company_name}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            {isAI && (
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: bucketColor, background: `${bucketColor}18`, border: `1px solid ${bucketColor}33`, borderRadius: 3, padding: "2px 5px", letterSpacing: 0.5, flexShrink: 0, marginTop: 2, fontWeight: 700 }}>AI</span>
            )}
            <div style={{ fontSize: 13, color: isAI ? summaryColor : fallbackColor, lineHeight: 1.55, fontFamily: "'Manrope', sans-serif", fontWeight: isAI ? 500 : 400 }}>
              {mainText}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <MagnitudeDot magnitude={item.magnitude} />
          <span style={{ fontSize: 11, color: metaColor, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{timeAgo(item.filing_time)}</span>
          <span style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${divColor}` }}>
          <div style={{ background: expandBg, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: metaColor, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, marginBottom: 5 }}>NSE FILING TYPE</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontFamily: "'Manrope', sans-serif", lineHeight: 1.5 }}>{item.description}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 11, color: metaColor, fontFamily: "'JetBrains Mono', monospace" }}>Filed: {formatDate(item.filing_time)}</span>
            {item.attachment_url && (
              <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                style={{ fontSize: 12, color: bucketColor, border: `1px solid ${bucketColor}55`, borderRadius: 7, padding: "7px 16px", textDecoration: "none", fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: `${bucketColor}11` }}>
                View PDF ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`, borderRadius: 20, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s ease" }}>
      <div style={{ width: 34, height: 18, borderRadius: 9, background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", position: "relative" }}>
        <div style={{ position: "absolute", top: 2, left: isDark ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: isDark ? "#ffd54f" : "#374151", transition: "left 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>
          {isDark ? "☽" : "☀"}
        </div>
      </div>
      <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>{isDark ? "Dark" : "Light"}</span>
    </button>
  )
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bucketCounts, setBucketCounts]   = useState<Record<string, number>>({})
  const [loading, setLoading]             = useState(true)
  const [activeBucket, setActiveBucket]   = useState<string | null>(null)
  const [search, setSearch]               = useState("")
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null)
  const [refreshing, setRefreshing]       = useState(false)
  const [isDark, setIsDark]               = useState(true)

  // ── Theme ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) setIsDark(saved === "dark")
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  // ── Read bucket from URL ────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bucket = params.get("bucket")
    if (bucket && SIGNAL_BUCKETS.includes(bucket)) {
      setActiveBucket(bucket)
    }
  }, [])

  // ── Fetch exact counts from DB (separate query, always accurate) ────────────
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements?countOnly=true")
      const counts = await res.json()
      if (counts && typeof counts === "object" && !counts.error) {
        setBucketCounts(counts)
      }
    } catch (e) { console.error(e) }
  }, [])

  // ── Fetch filings data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async (bucket: string | null, showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    setLoading(true)
    try {
      const url = bucket
        ? `/api/announcements?bucket=${encodeURIComponent(bucket)}`
        : "/api/announcements"
      const res  = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAnnouncements(data)
        setLastUpdated(new Date())
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  // ── On mount: fetch counts + filings ───────────────────────────────────────
  useEffect(() => {
    fetchCounts()
    fetchData(null)
  }, [])

  // ── When bucket changes ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeBucket !== null) fetchData(activeBucket)
  }, [activeBucket])

  // ── Auto-refresh every 30s ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCounts()
      fetchData(activeBucket)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeBucket])

  function openBucketInNewTab(bucketId: string) {
    const url = new URL(window.location.href)
    url.searchParams.delete("bucket")
    url.searchParams.set("bucket", bucketId)
    window.open(url.toString(), "_blank")
  }

  const activeBucketObj = BUCKETS.find((b) => b.id === activeBucket)
  const isBucketView    = !!activeBucket

  const visibleFilings = announcements.filter((item) => {
    const inBucket = !activeBucket || item.bucket === activeBucket
    if (!search) return inBucket
    const q = search.toLowerCase()
    return inBucket && (
      item.symbol?.toLowerCase().includes(q) ||
      item.Company_name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.ai_summary?.toLowerCase().includes(q)
    )
  })

  // ── Theme values ────────────────────────────────────────────────────────────
  const bg           = isDark ? "#0d1117"                : "#f3f4f6"
  const headerBg     = isDark ? "rgba(13,17,23,0.95)"   : "rgba(243,244,246,0.95)"
  const headerBorder = isDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)"
  const titleColor   = isDark ? "#ffffff"                : "#111827"
  const subColor     = isDark ? "rgba(255,255,255,0.5)"  : "rgba(0,0,0,0.5)"
  const countColor   = isDark ? "#ffffff"                : "#111827"
  const cardLabel    = isDark ? "#e2e8f0"                : "#1f2937"
  const cardDesc     = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"
  const searchBg     = isDark ? "rgba(255,255,255,0.05)" : "#ffffff"
  const searchBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"
  const footerColor  = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"
  const footerBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const totalSignal  = Object.values(bucketCounts).reduce((a, b) => a + b, 0)

  const bColor  = activeBucketObj ? (isDark ? activeBucketObj.darkColor  : activeBucketObj.color)  : "#00a875"
  const bBorder = activeBucketObj ? (isDark ? activeBucketObj.darkBorder : activeBucketObj.border) : ""
  const bBg     = activeBucketObj ? (isDark ? activeBucketObj.darkBg     : activeBucketObj.bg)     : ""

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; transition: background 0.3s; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .bucket-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.15) !important; }
        .filing-card:hover { border-color: ${isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)"} !important; }
      `}</style>

      <div style={{ minHeight: "100vh", background: bg, color: isDark ? "#e2e8f0" : "#1f2937", fontFamily: "'Manrope', sans-serif", transition: "background 0.3s, color 0.3s" }}>

        {isDark && <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 35% at 10% 10%, rgba(0,229,160,0.05) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />}

        {/* HEADER */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${headerBorder}`, background: headerBg, backdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 62, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #00e5a0, #00b4d8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#0d1117", fontWeight: 900 }}>◆</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: -0.5, color: titleColor }}>InsightInvest</span>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#00a875", background: "rgba(0,168,117,0.1)", padding: "3px 8px", borderRadius: 4, letterSpacing: 1.5, border: "1px solid rgba(0,168,117,0.2)" }}>NSE LIVE</span>
            </div>
            <div style={{ flex: 1 }} />
            {lastUpdated && (
              <span style={{ fontSize: 11, color: subColor, fontFamily: "'JetBrains Mono', monospace" }}>
                Updated {timeAgo(lastUpdated.toISOString())}
              </span>
            )}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button onClick={() => { fetchCounts(); fetchData(activeBucket, true) }}
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "8px 18px", color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)", fontSize: 13, cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>↻</span> Refresh
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 28px 80px", position: "relative", zIndex: 1 }}>

          {isBucketView && activeBucketObj ? (
            // ── BUCKET VIEW ─────────────────────────────────────────────────
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, padding: "20px 24px", background: bBg, border: `1px solid ${bBorder}`, borderRadius: 16, animation: "fadeUp 0.4s both" }}>
              <div style={{ width: 44, height: 44, background: `${bColor}22`, border: `1px solid ${bColor}44`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: bColor, flexShrink: 0 }}>
                {activeBucketObj.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: bColor, marginBottom: 4 }}>
                  {activeBucketObj.label}
                </h1>
                <p style={{ fontSize: 13, color: subColor }}>
                  <span style={{ color: bColor, fontWeight: 700 }}>{bucketCounts[activeBucketObj.id] ?? visibleFilings.length}</span> filings · {activeBucketObj.description} · Jan 2026 → Today
                </p>
              </div>
              <a href="/" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: subColor, textDecoration: "none", fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 7, padding: "6px 14px" }}>
                ← All buckets ↗
              </a>
            </div>
          ) : (
            // ── MAIN DASHBOARD ───────────────────────────────────────────────
            <>
              <div style={{ marginBottom: 32, animation: "fadeUp 0.4s both" }}>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: -1, color: titleColor, marginBottom: 8 }}>Discovery</h1>
                <p style={{ fontSize: 14, color: subColor }}>
                  <span style={{ color: "#00a875", fontWeight: 700 }}>{totalSignal}</span> signal filings · Jan 2026 → Today · Click a bucket to explore
                </p>
              </div>

              {/* 2×2 bucket grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 32 }}>
                {BUCKETS.map((b, i) => {
                  const bc = isDark ? b.darkColor : b.color
                  return (
                    <button key={b.id} className="bucket-btn"
                      onClick={() => openBucketInNewTab(b.id)}
                      title={`Open ${b.label} in new tab`}
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, borderRadius: 14, padding: "22px 24px", cursor: "pointer", textAlign: "left", transition: "all 0.18s ease", animation: `fadeUp 0.4s ${i * 0.06}s both`, boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)", position: "relative" }}>
                      <span style={{ position: "absolute", top: 12, right: 14, fontSize: 9, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>↗</span>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={{ fontSize: 22, color: bc }}>{b.icon}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: countColor, letterSpacing: -1 }}>
                          {bucketCounts[b.id] !== undefined ? bucketCounts[b.id] : "—"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: cardLabel, marginBottom: 5 }}>{b.label}</div>
                      <div style={{ fontSize: 12, color: cardDesc, fontFamily: "'Manrope', sans-serif" }}>{b.description}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ fontSize: 12, color: subColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 14 }}>
                RECENT FILINGS
              </div>
            </>
          )}

          {/* SEARCH */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: searchBg, border: `1px solid ${searchBorder}`, borderRadius: 9, padding: "9px 16px", flex: 1, maxWidth: 400, boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} strokeWidth={2}>
                <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol, company or keyword…"
                style={{ background: "none", border: "none", outline: "none", color: isDark ? "#fff" : "#111827", fontSize: 13, width: "100%", fontFamily: "'Manrope', sans-serif" }} />
            </div>
            <span style={{ fontSize: 12, color: subColor, fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
              {visibleFilings.length} filings
            </span>
          </div>

          {/* FILINGS */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: subColor }}>
              <div style={{ width: 28, height: 28, border: "2px solid rgba(0,168,117,0.2)", borderTop: "2px solid #00a875", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 14 }}>Loading filings…</div>
            </div>
          ) : visibleFilings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: subColor }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>◇</div>
              <div style={{ fontSize: 14 }}>No filings match this filter</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleFilings.map((item, i) => {
                const bucket = BUCKETS.find((b) => b.id === item.bucket)
                const bc = bucket ? (isDark ? bucket.darkColor : bucket.color) : "#888"
                return (
                  <div key={item.id} className="filing-card" style={{ animation: `fadeUp 0.35s ${Math.min(i * 0.02, 0.3)}s both`, borderRadius: 12 }}>
                    <FilingCard item={item} bucketColor={bc} isDark={isDark} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 52, paddingTop: 20, borderTop: `1px solid ${footerBorder}`, fontSize: 11, color: footerColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 2 }}>
            Data sourced from NSE India · AI insights by Claude · Auto-refreshes every 30s · Jan 2026 → Present · Not SEBI registered · Not investment advice
          </div>
        </main>
      </div>
    </>
  )
}
