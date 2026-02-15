import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 IMPORTANT
)

export async function GET() {
  try {
    const baseHeaders = {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json",
      "Referer": "https://www.nseindia.com/",
    }

    // Step 1: Get cookies
    const homeResponse = await fetch("https://www.nseindia.com", {
      headers: baseHeaders,
    })

    const cookies = homeResponse.headers.get("set-cookie")

    // Step 2: Fetch announcements
    const apiResponse = await fetch(
      "https://www.nseindia.com/api/corporate-announcements?index=equities",
      {
        headers: {
          ...baseHeaders,
          Cookie: cookies || "",
        },
      }
    )

    const nseData = await apiResponse.json()

    if (!Array.isArray(nseData)) {
      return Response.json({ error: "Invalid NSE data" })
    }

    // Transform + Insert into Supabase
    const transformed = nseData.map((item: any) => ({
      symbol: item.symbol,
      Company_name: item.sm_name,
      description: item.desc,
      announcement_dt: item.desc,
      attachment_url: item.attchmntFile,
    }))

    const { error } = await supabase
      .from("announcements")
      .upsert(transformed, {
  onConflict: "symbol,description,created_at"
})



    if (error) {
      return Response.json({ error: error.message })
    }

    return Response.json({ success: true, inserted: transformed.length })
  } catch (err: any) {
    return Response.json({ error: err.message })
  }
}
