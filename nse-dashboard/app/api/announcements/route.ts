import { supabase } from "@/lib/supabase"

const SIGNAL_BUCKETS = [
  "Quarterly Results",
  "Order Win",
  "Capex Plan",
  "Dividend",
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket    = searchParams.get("bucket")
    const countOnly = searchParams.get("countOnly")
    const segment   = searchParams.get("segment") || "equities"

    // ── Exact counts per bucket for a given segment ──────────────────────────
    if (countOnly === "true") {
      const counts: Record<string, number> = {}
      await Promise.all(
        SIGNAL_BUCKETS.map(async (b) => {
          const { count } = await supabase
            .from("announcements")
            .select("*", { count: "exact", head: true })
            .eq("bucket", b)
            .eq("segment", segment)
            .gte("filing_time", "2026-01-01T00:00:00+05:30")
          counts[b] = count ?? 0
        })
      )
      return Response.json(counts)
    }

    // ── Specific bucket + segment ────────────────────────────────────────────
    if (bucket && SIGNAL_BUCKETS.includes(bucket)) {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("bucket", bucket)
        .eq("segment", segment)
        .gte("filing_time", "2026-01-01T00:00:00+05:30")
        .order("filing_time", { ascending: false })
        .limit(500)

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json(data ?? [])
    }

    // ── Default: recent filings for segment ──────────────────────────────────
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .in("bucket", SIGNAL_BUCKETS)
      .eq("segment", segment)
      .gte("filing_time", "2026-01-01T00:00:00+05:30")
      .order("filing_time", { ascending: false })
      .limit(200)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data ?? [])

  } catch (err: any) {
    return Response.json({ error: "Unexpected error" }, { status: 500 })
  }
}
