import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Convert NSE date to proper ISO (IST)
function convertNseDate(nseDate: string) {
  if (!nseDate) return null

  const months: any = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  }

  const [datePart, timePart] = nseDate.split(" ")
  const [day, mon, year] = datePart.split("-")

  const month = months[mon]

  return `${year}-${month}-${day}T${timePart}+05:30`
}

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

    const transformed = nseData.map((item: any) => ({
      seq_id: item.seq_id,   // 🔥 IMPORTANT
      symbol: item.symbol,
      Company_name: item.sm_name,
      description: item.desc,
      announcement: item.attchmntText,
      attachment_url: item.attchmntFile,
      filing_time: convertNseDate(item.an_dt)
    }))

    const { error } = await supabase
      .from("announcements")
      .upsert(transformed, {
        onConflict: "seq_id"   // 🔥 MUST MATCH UNIQUE CONSTRAINT
      })

    if (error) {
      return Response.json({ error: error.message })
    }

    return Response.json({ success: true, inserted: transformed.length })

  } catch (err: any) {
    return Response.json({ error: err.message })
  }
}
