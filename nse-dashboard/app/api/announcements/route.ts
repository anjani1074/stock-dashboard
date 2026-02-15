import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("filing_time", { ascending: false })

    if (error) {
      console.error("Supabase fetch error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data ?? [])
  } catch (err: any) {
    console.error("Unexpected error:", err.message)
    return Response.json({ error: "Unexpected error" }, { status: 500 })
  }
}
