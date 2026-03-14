"use client"

import { useEffect, useState } from "react"

interface Announcement {
  id: number
  seq_id: string
  filing_time: string | null
  symbol: string
  Company_name: string
  description: string
  announcement: string
  attachment_url: string
  bucket: string | null
  magnitude: string | null
}

const BUCKET_COLORS: Record<string, string> = {
  "Excellent Results": "#00e5a0",
  "Order Win":         "#4fc3f7",
  "Capex Plan":        "#ffd54f",
  "Turnaround":        "#ff8a65",
  "Dividend":          "#ce93d8",
  "Growth Stock":      "#a5d6a7",
  "Board Meeting":     "#888",
  "Press Release":     "#888",
  "Other":             "#444",
}

export default function AdminPage() {
  const [data, setData] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/announcements")
      const json = await res.json()
      if (Array.isArray(json)) setData(json)
    } finally {
      setLoading(false)
    }
  }

  async function runBackfill() {
    setBackfilling(true)
    setBackfillResult(null)
    try {
      const res = await fetch("/api/fetch-nse?mode=backfill")
      const json = await res.json()
      setBackfillResult(
        json.error
          ? `Error: ${json.error}`
          : `✓ Fetched ${json.total_fetched} filings across ${json.ranges_fetched} weeks. Upserted ${json.total_upserted}.`
      )
      await fetchData()
    } catch (e: any) {
      setBackfillResult(`Error: ${e.message}`)
    } finally {
      setBackfilling(false)
    }
  }

  async function runDaily() {
    try {
      const res = await fetch("/api/fetch-nse")
      const json = await res.json()
      setBackfillResult(
        json.error
          ? `Error: ${json.error}`
          : `✓ Daily fetch done. ${json.total_fetched} filings fetched.`
      )
      await fetchData()
    } catch (e: any) {
      setBackfillResult(`Error: ${e.message}`)
    }
  }

  useEffect(() => { fetchData() }, [])

  const buckets = ["All", ...Object.keys(BUCKET_COLORS)]

  const bucketCounts = data.reduce((acc, item) => {
    const b = item.bucket || "Other"
    acc[b] = (acc[b] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filtered = data
    .filter((item) => filter === "All" || (item.bucket || "Other") === filter)
    .filter((item) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        item.symbol?.toLowerCase().includes(q) ||
        item.Company_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      )
    })

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c10", color: "#e2e8f0", fontFamily: "monospace", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>⚙ Admin — Filing QA View</h1>
          <span style={{ fontSize: 10, background: "rgba(255,100,100,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,100,100,0.3)", padding: "2px 8px", borderRadius: 4 }}>
            NOT PUBLIC
          </span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {data.length} total filings in DB · {filtered.length} shown
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={runBackfill}
          disabled={backfilling}
          style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", borderRadius: 8, padding: "8px 16px", color: "#00e5a0", fontSize: 12, cursor: backfilling ? "not-allowed" : "pointer", opacity: backfilling ? 0.6 : 1 }}
        >
          {backfilling ? "⏳ Backfilling Jan 1→today…" : "⬇ Backfill Jan 1, 2026 → Today"}
        </button>

        <button
          onClick={runDaily}
          style={{ background: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 8, padding: "8px 16px", color: "#4fc3f7", fontSize: 12, cursor: "pointer" }}
        >
          ↻ Fetch Last 2 Days
        </button>

        <button
          onClick={fetchData}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}
        >
          ⟳ Reload Table
        </button>

        {backfillResult && (
          <span style={{ fontSize: 11, color: backfillResult.startsWith("Error") ? "#ff6b6b" : "#00e5a0", background: "rgba(255,255,255,0.04)", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
            {backfillResult}
          </span>
        )}
      </div>

      {/* Bucket summary */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(bucketCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([bucket, count]) => (
            <button
              key={bucket}
              onClick={() => setFilter(filter === bucket ? "All" : bucket)}
              style={{
                background: filter === bucket ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === bucket ? (BUCKET_COLORS[bucket] || "#888") + "66" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 6,
                padding: "4px 12px",
                color: BUCKET_COLORS[bucket] || "#888",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {bucket} <span style={{ opacity: 0.6 }}>({count})</span>
            </button>
          ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search symbol, company, description..."
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 14px", color: "#fff", fontSize: 12, width: "100%", maxWidth: 400, marginBottom: 16, outline: "none", fontFamily: "monospace" }}
      />

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                {["Symbol", "Company", "Description", "Bucket", "Magnitude", "Filed", "PDF"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const bucketColor = BUCKET_COLORS[item.bucket || "Other"] || "#444"
                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                      {item.symbol}
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.Company_name}
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.description}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ background: bucketColor + "18", color: bucketColor, border: `1px solid ${bucketColor}33`, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                        {item.bucket || "Other"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
                      {item.magnitude || "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                      {formatDate(item.filing_time)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {item.attachment_url ? (
                        <a href={item.attachment_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#4fc3f7", textDecoration: "none", fontSize: 11 }}>
                          PDF ↗
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}