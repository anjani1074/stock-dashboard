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
  {
    id: "Quarterly Results",
    label: "Quarterly Results",
    shortLabel: "Q Results",
    icon: "▣",
    color: "#10b981",
    darkColor: "#34d399",
    border: "rgba(16,185,129,0.3)",
    darkBorder: "rgba(52,211,153,0.25)",
    bg: "rgba(16,185,129,0.07)",
    darkBg: "rgba(52,211,153,0.06)",
    description: "Q3 FY26 financial results",
    accent: "#064e3b",
  },
  {
    id: "Order Win",
    label: "Order Book",
    shortLabel: "Orders",
    icon: "◈",
    color: "#3b82f6",
    darkColor: "#60a5fa",
    border: "rgba(59,130,246,0.3)",
    darkBorder: "rgba(96,165,250,0.25)",
    bg: "rgba(59,130,246,0.07)",
    darkBg: "rgba(96,165,250,0.06)",
    description: "New contracts & LOAs",
    accent: "#1e3a5f",
  },
  {
    id: "Capex Plan",
    label: "Capex Plans",
    shortLabel: "Capex",
    icon: "⬡",
    color: "#f59e0b",
    darkColor: "#fbbf24",
    border: "rgba(245,158,11,0.3)",
    darkBorder: "rgba(251,191,36,0.25)",
    bg: "rgba(245,158,11,0.07)",
    darkBg: "rgba(251,191,36,0.06)",
    description: "Capacity expansions",
    accent: "#451a03",
  },
  {
    id: "Dividend",
    label: "Dividends",
    shortLabel: "Dividends",
    icon: "◎",
    color: "#8b5cf6",
    darkColor: "#a78bfa",
    border: "rgba(139,92,246,0.3)",
    darkBorder: "rgba(167,139,250,0.25)",
    bg: "rgba(139,92,246,0.07)",
    darkBg: "rgba(167,139,250,0.06)",
    description: "Dividend declarations",
    accent: "#2e1065",
  },
]

const SIGNAL_BUCKETS = BUCKETS.map((b) => b.id)

function formatDate(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(d: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })
}

function MagnitudeBadge({ magnitude, color }: { magnitude: string | null; color: string }) {
  if (!magnitude || magnitude === "low") return null
  return (
    <span style={{
      fontSize: 9,
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 700,
      letterSpacing: 1,
      padding: "2px 6px",
      borderRadius: 3,
      background: magnitude === "high" ? `${color}20` : `${color}12`,
      color: magnitude === "high" ? color : `${color}bb`,
      border: `1px solid ${color}30`,
    }}>
      {magnitude === "high" ? "HIGH IMPACT" : "NOTABLE"}
    </span>
  )
}

function FilingCard({
  item,
  bucket,
  isDark,
  index,
}: {
  item: Announcement
  bucket: typeof BUCKETS[0] | undefined
  isDark: boolean
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const bColor = bucket ? (isDark ? bucket.darkColor : bucket.color) : "#6b7280"
  const mainText = item.ai_summary || item.description
  const isAI = !!item.ai_summary

  const cardBg = isDark
    ? expanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)"
    : expanded ? "rgba(0,0,0,0.03)" : "#ffffff"

  const cardBorder = isDark
    ? expanded ? `${bColor}40` : "rgba(255,255,255,0.08)"
    : expanded ? `${bColor}55` : "rgba(0,0,0,0.08)"

  const nameColor = isDark ? "#f1f5f9" : "#0f172a"
  const metaColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
  const summaryColor = isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.68)"
  const divColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: "14px 18px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        animation: `fadeUp 0.3s ${Math.min(index * 0.02, 0.25)}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent line */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: bColor,
        borderRadius: "10px 0 0 10px",
        opacity: expanded ? 1 : 0.4,
        transition: "opacity 0.15s",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingLeft: 6 }}>
        {/* Symbol */}
        <div style={{ flexShrink: 0, minWidth: 80 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: bColor,
            letterSpacing: 0.5,
            marginBottom: 3,
          }}>
            {item.symbol}
          </div>
          <div style={{
            fontSize: 9,
            color: metaColor,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: 0.5,
          }}>
            {formatDateShort(item.filing_time)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, alignSelf: "stretch", background: divColor, flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: nameColor,
            lineHeight: 1.3,
            marginBottom: 5,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: -0.1,
          }}>
            {item.Company_name}
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
            {isAI && (
              <span style={{
                fontSize: 8,
                fontFamily: "'IBM Plex Mono', monospace",
                color: bColor,
                background: `${bColor}15`,
                border: `1px solid ${bColor}30`,
                borderRadius: 3,
                padding: "2px 5px",
                letterSpacing: 0.8,
                flexShrink: 0,
                marginTop: 2,
                fontWeight: 700,
              }}>AI</span>
            )}
            <div style={{
              fontSize: 12,
              color: summaryColor,
              lineHeight: 1.55,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: isAI ? 500 : 400,
            }}>
              {mainText}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <MagnitudeBadge magnitude={item.magnitude} color={bColor} />
          <span style={{
            fontSize: 9,
            color: metaColor,
            fontFamily: "'IBM Plex Mono', monospace",
            transition: "transform 0.15s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}>▼</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${divColor}`, paddingLeft: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.8, marginBottom: 4 }}>
                NSE FILING TYPE
              </div>
              <div style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {item.description}
              </div>
              <div style={{ fontSize: 10, color: metaColor, fontFamily: "'IBM Plex Mono', monospace", marginTop: 6 }}>
                Filed: {formatDate(item.filing_time)}
              </div>
            </div>
            {item.attachment_url && (
              <a
                href={item.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 11,
                  color: bColor,
                  border: `1px solid ${bColor}40`,
                  borderRadius: 6,
                  padding: "6px 14px",
                  textDecoration: "none",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 600,
                  background: `${bColor}0d`,
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                VIEW PDF ↗
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
    <button
      onClick={onToggle}
      style={{
        background: "none",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
        borderRadius: 8,
        padding: "6px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
        fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
        transition: "all 0.15s",
        letterSpacing: 0.3,
      }}
    >
      {isDark ? "☀ LIGHT" : "☽ DARK"}
    </button>
  )
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [bucketCounts, setBucketCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [activeBucket, setActiveBucket] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) setIsDark(saved === "dark")
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bucket = params.get("bucket")
    if (bucket && SIGNAL_BUCKETS.includes(bucket)) setActiveBucket(bucket)
  }, [])

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements?countOnly=true")
      const counts = await res.json()
      if (counts && typeof counts === "object" && !counts.error) setBucketCounts(counts)
    } catch (e) { console.error(e) }
  }, [])

  const fetchData = useCallback(async (bucket: string | null, showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    setLoading(true)
    try {
      const url = bucket
        ? `/api/announcements?bucket=${encodeURIComponent(bucket)}`
        : "/api/announcements"
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAnnouncements(data)
        setLastUpdated(new Date())
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchCounts(); fetchData(null) }, [])
  useEffect(() => { if (activeBucket !== null) fetchData(activeBucket) }, [activeBucket])
  useEffect(() => {
    const interval = setInterval(() => { fetchCounts(); fetchData(activeBucket) }, 30000)
    return () => clearInterval(interval)
  }, [activeBucket])

  function openBucketInNewTab(bucketId: string) {
    const url = new URL(window.location.href)
    url.searchParams.delete("bucket")
    url.searchParams.set("bucket", bucketId)
    window.open(url.toString(), "_blank")
  }

  const activeBucketObj = BUCKETS.find((b) => b.id === activeBucket)
  const isBucketView = !!activeBucket
  const bColor = activeBucketObj ? (isDark ? activeBucketObj.darkColor : activeBucketObj.color) : "#10b981"
  const bBorder = activeBucketObj ? (isDark ? activeBucketObj.darkBorder : activeBucketObj.border) : ""
  const bBg = activeBucketObj ? (isDark ? activeBucketObj.darkBg : activeBucketObj.bg) : ""

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

  const totalSignal = Object.values(bucketCounts).reduce((a, b) => a + b, 0)

  // Theme
  const bg = isDark ? "#0a0d12" : "#f8fafc"
  const headerBg = isDark ? "rgba(10,13,18,0.92)" : "rgba(248,250,252,0.92)"
  const headerBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const titleColor = isDark ? "#f1f5f9" : "#0f172a"
  const subColor = isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.4)"
  const cardBorderDefault = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"
  const searchBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff"
  const footerColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)"
  const footerBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"
  const sectionLabel = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}; border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .bucket-card:hover { transform: translateY(-2px); border-color: var(--hover-border) !important; }
        .filing-row:hover { background: ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"} !important; border-color: ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)"} !important; }
        .search-input::placeholder { color: ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)"}; }
      `}</style>

      <div style={{ minHeight: "100vh", background: bg, color: isDark ? "#e2e8f0" : "#1e293b", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.2s" }}>

        {/* Ambient glow — dark mode only */}
        {isDark && (
          <>
            <div style={{ position: "fixed", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "fixed", bottom: -200, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
          </>
        )}

        {/* ── HEADER ── */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${headerBorder}`, background: headerBg, backdropFilter: "blur(24px)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 16 }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #10b981, #3b82f6)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 900 }}>▣</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: titleColor }}>InsightInvest</span>
            </div>

            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 4, background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", color: "#10b981", letterSpacing: 1.2, fontWeight: 700 }}>NSE LIVE</span>
            </div>

            <div style={{ flex: 1 }} />

            {/* Last updated */}
            {lastUpdated && (
              <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>
                {formatDateShort(lastUpdated.toISOString())}
              </span>
            )}

            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {/* Refresh */}
            <button
              onClick={() => { fetchCounts(); fetchData(activeBucket, true) }}
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", border: `1px solid ${headerBorder}`, borderRadius: 8, padding: "6px 14px", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontSize: 11, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", gap: 6, letterSpacing: 0.3 }}
            >
              <span style={{ display: "inline-block", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>↻</span>
              REFRESH
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px", position: "relative", zIndex: 1 }}>

          {isBucketView && activeBucketObj ? (
            // ── BUCKET VIEW ─────────────────────────────────────────────────
            <div style={{ marginBottom: 28, animation: "fadeUp 0.3s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 18, color: bColor }}>{activeBucketObj.icon}</span>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: titleColor }}>
                  {activeBucketObj.label}
                </h1>
                <div style={{ height: 1, flex: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                <a href="/" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 10, color: subColor, textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
                  ← ALL BUCKETS
                </a>
              </div>
              <p style={{ fontSize: 12, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>
                <span style={{ color: bColor, fontWeight: 700 }}>{bucketCounts[activeBucketObj.id] ?? "—"}</span>
                {" "}filings · {activeBucketObj.description} · Jan 2026 → Today
              </p>
            </div>
          ) : (
            // ── MAIN DASHBOARD ───────────────────────────────────────────────
            <>
              {/* Page header */}
              <div style={{ marginBottom: 28, animation: "fadeUp 0.3s both" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                  <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: -0.8, color: titleColor }}>
                    Discovery
                  </h1>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: subColor, letterSpacing: 0.5 }}>
                    NSE Corporate Filings Intelligence
                  </span>
                </div>
                <p style={{ fontSize: 11, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.3 }}>
                  <span style={{ color: isDark ? "#34d399" : "#059669", fontWeight: 700 }}>{totalSignal.toLocaleString()}</span>
                  {" "}signal filings indexed · Jan 2026 → Today · Click any bucket to explore
                </p>
              </div>

              {/* Bucket cards — 2×2 grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
                {BUCKETS.map((b, i) => {
                  const bc = isDark ? b.darkColor : b.color
                  const count = bucketCounts[b.id]
                  return (
                    <div
                      key={b.id}
                      className="bucket-card"
                      onClick={() => openBucketInNewTab(b.id)}
                      style={{
                        background: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                        borderRadius: 12,
                        padding: "20px 22px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        animation: `fadeUp 0.3s ${i * 0.06}s both`,
                        boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                        position: "relative",
                        overflow: "hidden",
                        // @ts-ignore
                        "--hover-border": `${bc}44`,
                      } as any}
                    >
                      {/* Top accent bar */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${bc}, ${bc}44)`, borderRadius: "12px 12px 0 0" }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16, color: bc }}>{b.icon}</span>
                          <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: bc, letterSpacing: 0.8, fontWeight: 700 }}>
                            {b.shortLabel.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: 9, color: subColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>↗ OPEN</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 34, fontWeight: 700, color: titleColor, letterSpacing: -2, lineHeight: 1 }}>
                          {count !== undefined ? count.toLocaleString() : "—"}
                        </span>
                        <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace" }}>filings</span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 2 }}>
                        {b.label}
                      </div>
                      <div style={{ fontSize: 11, color: subColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {b.description}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 10, color: sectionLabel, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1.2, fontWeight: 700 }}>
                  RECENT FILINGS
                </span>
                <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }} />
              </div>
            </>
          )}

          {/* ── SEARCH BAR ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 8, background: searchBg, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}`, borderRadius: 8, padding: "8px 14px", boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.05)" }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} strokeWidth={2}>
                <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol, company or keyword…"
                style={{ background: "none", border: "none", outline: "none", color: isDark ? "#f1f5f9" : "#0f172a", fontSize: 12, width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: subColor, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            {/* Active bucket pill */}
            {activeBucketObj && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: bBg, border: `1px solid ${bBorder}`, borderRadius: 6, padding: "6px 12px", fontSize: 11, color: bColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
                {activeBucketObj.icon} {activeBucketObj.shortLabel.toUpperCase()}
                <button onClick={() => setActiveBucket(null)} style={{ background: "none", border: "none", color: bColor, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
              </div>
            )}

            <span style={{ fontSize: 10, color: subColor, fontFamily: "'IBM Plex Mono', monospace", marginLeft: "auto", letterSpacing: 0.5 }}>
              {visibleFilings.length.toLocaleString()} RESULTS
            </span>
          </div>

          {/* ── FILINGS ── */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: subColor }}>
              <div style={{
  width: 24,
  height: 24,
  borderTop: "2px solid #10b981",
  borderRight: "2px solid transparent",
  borderBottom: "2px solid transparent",
  borderLeft: "2px solid transparent",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  margin: "0 auto 14px",
}} />
              <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>LOADING FILINGS…</div>
            </div>
          ) : visibleFilings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: subColor }}>
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>◇</div>
              <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>NO FILINGS MATCH</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {visibleFilings.map((item, i) => {
                const bucket = BUCKETS.find((b) => b.id === item.bucket)
                return (
                  <div key={item.id} className="filing-row" style={{ borderRadius: 10 }}>
                    <FilingCard item={item} bucket={bucket} isDark={isDark} index={i} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 18, borderTop: `1px solid ${footerBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 10, color: footerColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
              DATA: NSE INDIA · AI: CLAUDE · AUTO-REFRESH: 30S · JAN 2026 → PRESENT
            </span>
            <span style={{ fontSize: 10, color: footerColor, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
              NOT SEBI REGISTERED · NOT INVESTMENT ADVICE
            </span>
          </div>
        </main>
      </div>
    </>
  )
}
