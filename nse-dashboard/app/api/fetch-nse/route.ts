import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function convertNseDate(nseDate: string) {
  if (!nseDate) return null
  const months: any = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  }
  const [datePart, timePart] = nseDate.split(" ")
  const [day, mon, year] = datePart.split("-")
  const month = months[mon]
  if (!month) return null
  return `${year}-${month}-${day}T${timePart}+05:30`
}

function formatForNse(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

function getWeekRanges(from: Date, to: Date) {
  const ranges = []
  let current = new Date(from)
  while (current < to) {
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (weekEnd > to) weekEnd.setTime(to.getTime())
    ranges.push({ from: formatForNse(new Date(current)), to: formatForNse(new Date(weekEnd)) })
    current.setDate(current.getDate() + 7)
  }
  return ranges
}

// ─── Keyword classifier ───────────────────────────────────────────────────────
function keywordClassify(
  description: string,
  announcement: string
): { bucket: string; magnitude: string } {
  if (!description) return { bucket: "Other", magnitude: "low" }

  const desc = description.toLowerCase().trim()
  const ann  = (announcement || "").toLowerCase()

  // ── 1. Newspaper publications — always noise ──────────────────────────────
  if (
    desc.includes("copy of newspaper") ||
    desc.includes("newspaper publication") ||
    desc.includes("copy of the newspaper") ||
    ann.includes("copy of newspaper publication")
  ) return { bucket: "Other", magnitude: "low" }

  // ── 2. Concall & Investor Meet — separate bucket ──────────────────────────
  if (
    desc.includes("analysts/institutional") ||
    desc.includes("analyst meet") ||
    desc.includes("investor meet") ||
    desc.includes("con. call") ||
    desc.includes("concall") ||
    desc.includes("conference call") ||
    desc.includes("earnings call") ||
    desc.includes("investor presentation") ||
    desc.includes("investor day") ||
    desc.includes("analyst day")
  ) return { bucket: "Concall & Investor Meet", magnitude: "low" }

  // ── 3. Clarifications — always noise ─────────────────────────────────────
  if (
    desc.includes("clarification") ||
    desc.includes("clarification - financial") ||
    desc.includes("clarification-financial") ||
    ann.includes("clarification on financial results") ||
    ann.includes("clarification to the financial results") ||
    ann.includes("clarification on the financial results")
  ) return { bucket: "Other", magnitude: "low" }

  // ── 4. Board meeting without results — noise ──────────────────────────────
  const isBoardOnly =
    (desc === "outcome of board meeting" ||
     desc === "board meeting" ||
     desc.includes("appointment") ||
     desc.includes("resignation") ||
     desc.includes("change in director") ||
     desc.includes("change in management") ||
     desc.includes("change in registrar")) &&
    !ann.includes("financial results") &&
    !ann.includes("results for the") &&
    !ann.includes("unaudited") &&
    !ann.includes("audited financial")

  if (isBoardOnly) return { bucket: "Other", magnitude: "low" }

  // ── 5. Quarterly Results ──────────────────────────────────────────────────
  const isResultsDesc =
    desc.includes("financial results") ||
    desc.includes("quarterly results") ||
    desc.includes("annual results") ||
    desc.includes("unaudited results") ||
    desc.includes("audited results") ||
    desc.includes("standalone results") ||
    desc.includes("consolidated results") ||
    desc.includes("half yearly results") ||
    desc.includes("half-yearly results")

  const isResultsAnn =
    ann.includes("financial results") ||
    ann.includes("unaudited financial results") ||
    ann.includes("audited financial results") ||
    ann.includes("quarterly results") ||
    ann.includes("results for the quarter") ||
    ann.includes("results for the period") ||
    ann.includes("results for the year") ||
    ann.includes("standalone financial results") ||
    ann.includes("consolidated financial results") ||
    (ann.includes("submitted to the exchange") && ann.includes("financial results")) ||
    (ann.includes("submitted to the exchange") && ann.includes("results for the"))

  if (isResultsDesc || isResultsAnn) {
    return { bucket: "Quarterly Results", magnitude: "medium" }
  }

  // ── 6. Order Win ──────────────────────────────────────────────────────────
  const isOrder =
    desc.includes("bagging") ||
    desc.includes("receiving of order") ||
    desc.includes("receipt of order") ||
    desc.includes("new order") ||
    desc.includes("order win") ||
    desc.includes("letter of award") ||
    desc.includes("loa") ||
    desc.includes("work order") ||
    desc.includes("contract award") ||
    desc.includes("secured order") ||
    desc.includes("order receipt") ||
    desc.includes("procurement order") ||
    ann.includes("bagging") ||
    ann.includes("letter of award") ||
    ann.includes("work order") ||
    ann.includes("order win") ||
    ann.includes("new order") ||
    ann.includes("secured order")

  if (isOrder) return { bucket: "Order Win", magnitude: "high" }

  // ── 7. Capex Plan ─────────────────────────────────────────────────────────
  const isCapex =
    desc.includes("capex") ||
    desc.includes("capital expenditure") ||
    desc.includes("greenfield") ||
    desc.includes("brownfield") ||
    desc.includes("capacity addition") ||
    desc.includes("capacity expansion") ||
    desc.includes("new plant") ||
    desc.includes("new facility") ||
    desc.includes("new manufacturing") ||
    desc.includes("setting up") ||
    ann.includes("capital expenditure") ||
    ann.includes("new plant") ||
    ann.includes("capacity expansion") ||
    ann.includes("greenfield") ||
    ann.includes("brownfield")

  if (isCapex) return { bucket: "Capex Plan", magnitude: "high" }

  // ── 8. Dividend ───────────────────────────────────────────────────────────
  const isDividend =
    desc.includes("dividend") ||
    desc.includes("interim dividend") ||
    desc.includes("final dividend") ||
    desc.includes("special dividend") ||
    ann.includes("interim dividend") ||
    ann.includes("final dividend") ||
    ann.includes("special dividend")

  if (isDividend) return { bucket: "Dividend", magnitude: "medium" }

  return { bucket: "Other", magnitude: "low" }
}

// ─── Claude AI classifier ─────────────────────────────────────────────────────
async function classifyWithClaude(
  items: { seq_id: string; description: string; announcement: string }[]
) {
  if (items.length === 0) return []

  const prompt = `You are an expert Indian stock market analyst reviewing NSE corporate filings.

Classify each filing into exactly one of these buckets:

- "Quarterly Results" → Company submitted financial results for any quarter or year. Look for: "financial results", "results for the period/quarter/year", "unaudited/audited results". NOTE: "Outcome of Board Meeting" often contains results — check announcement text. DO NOT classify clarifications as Quarterly Results.
- "Order Win" → New contract, work order, letter of award, order receipt, bagging of orders
- "Capex Plan" → Capital expenditure, new plant, capacity expansion, greenfield, brownfield
- "Dividend" → Dividend declared, interim dividend, final dividend, special dividend
- "Concall & Investor Meet" → Analyst meet, investor presentation, concall, conference call, earnings call, investor day
- "Other" → Everything else: clarifications, press releases, newspaper publications, regulatory disclosures, general updates, AGM/EGM, appointments, resignations, credit ratings, address changes

RULES:
1. "Clarification - Financial Results" → always "Other"
2. "Copy of Newspaper Publication" → always "Other"
3. "Outcome of Board Meeting" without results in announcement → "Other"
4. Analyst meet / concall / investor presentation → "Concall & Investor Meet"
5. Only classify as Order Win/Capex if explicitly stated

Return ONLY valid JSON array, no markdown:
[{"seq_id":"...","bucket":"...","ai_summary":"one line max 15 words specific to this filing","magnitude":"high|medium|low"}]

Filings:
${items.map(i => `seq_id:${i.seq_id} | desc:${i.description} | announcement:${(i.announcement || "").slice(0, 400)}`).join("\n---\n")}
`

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text || "[]"
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim())
  } catch {
    return []
  }
}

async function fetchWeek(fromDate: string, toDate: string, headers: any, cookies: string) {
  const url = `https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=${fromDate}&to_date=${toDate}`
  const res = await fetch(url, {
    headers: { ...headers, Cookie: cookies },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode")

    const baseHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
    }

    // Step 1: NSE cookies
    const homeRes = await fetch("https://www.nseindia.com", { headers: baseHeaders })
    const cookies = homeRes.headers.get("set-cookie") || ""

    // Step 2: Date ranges
    let ranges: { from: string; to: string }[]
    if (mode === "backfill") {
      ranges = getWeekRanges(new Date("2026-01-01"), new Date())
    } else {
      const today = new Date()
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      ranges = [{ from: formatForNse(twoDaysAgo), to: formatForNse(today) }]
    }

    // Step 3: Fetch from NSE
    let allRaw: any[] = []
    for (const range of ranges) {
      const data = await fetchWeek(range.from, range.to, baseHeaders, cookies)
      allRaw = [...allRaw, ...data]
      if (ranges.length > 1) await new Promise((r) => setTimeout(r, 500))
    }

    if (allRaw.length === 0) return Response.json({ error: "No data from NSE" })

    // Step 4: Transform + keyword classify
    const transformed = allRaw.map((item: any) => {
      const { bucket, magnitude } = keywordClassify(item.desc || "", item.attchmntText || "")
      return {
        seq_id:         item.seq_id,
        symbol:         item.symbol,
        Company_name:   item.sm_name,
        description:    item.desc,
        announcement:   item.attchmntText,
        attachment_url: item.attchmntFile,
        filing_time:    convertNseDate(item.an_dt),
        bucket,
        magnitude,
        ai_summary:     null,
      }
    })

    // Step 5: Upsert in batches of 100
    let totalUpserted = 0
    for (let i = 0; i < transformed.length; i += 100) {
      const batch = transformed.slice(i, i + 100)
      const { error } = await supabase
        .from("announcements")
        .upsert(batch, { onConflict: "seq_id" })
      if (!error) totalUpserted += batch.length
    }

    // Step 6: Claude processes signal rows with no ai_summary
    const { data: needsAI } = await supabase
      .from("announcements")
      .select("seq_id, description, announcement, bucket")
      .is("ai_summary", null)
      .in("bucket", ["Quarterly Results", "Order Win", "Capex Plan", "Dividend", "Concall & Investor Meet"])
      .gte("filing_time", "2026-01-01T00:00:00+05:30")
      .limit(50)

    let totalAIClassified = 0
    if (needsAI && needsAI.length > 0) {
      for (let i = 0; i < needsAI.length; i += 25) {
        const batch = needsAI.slice(i, i + 25)
        const classified = await classifyWithClaude(batch)
        const updates = classified.map((c: any) =>
          supabase.from("announcements").update({
            bucket:     c.bucket,
            ai_summary: c.ai_summary,
            magnitude:  c.magnitude,
          }).eq("seq_id", c.seq_id)
        )
        await Promise.all(updates)
        totalAIClassified += classified.length
      }
    }

    return Response.json({
      success:        true,
      mode:           mode || "daily",
      ranges_fetched: ranges.length,
      total_fetched:  allRaw.length,
      total_upserted: totalUpserted,
      sent_to_claude: needsAI?.length ?? 0,
      ai_classified:  totalAIClassified,
    })

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
