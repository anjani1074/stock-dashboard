import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return Response.json({ error: "Query too short" }, { status: 400 })
    }

    // Search by symbol or company name
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .or(`symbol.ilike.%${query}%,Company_name.ilike.%${query}%`)
      .gte("filing_time", "2026-01-01T00:00:00+05:30")
      .not("bucket", "eq", "Other")
      .not("bucket", "eq", "Board Meeting")
      .not("bucket", "eq", "Concall & Investor Meet")
      .order("filing_time", { ascending: false })
      .limit(200)

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Also get distinct companies that match for autocomplete
    const { data: companies } = await supabase
      .from("announcements")
      .select("symbol, Company_name")
      .or(`symbol.ilike.%${query}%,Company_name.ilike.%${query}%`)
      .gte("filing_time", "2026-01-01T00:00:00+05:30")
      .order("Company_name", { ascending: true })
      .limit(10)

    // Deduplicate companies
    const seen = new Set<string>()
    const uniqueCompanies = (companies ?? []).filter((c) => {
      if (seen.has(c.symbol)) return false
      seen.add(c.symbol)
      return true
    })

    return Response.json({
      filings: data ?? [],
      companies: uniqueCompanies,
    })

  } catch (err: any) {
    return Response.json({ error: "Unexpected error" }, { status: 500 })
  }
}
