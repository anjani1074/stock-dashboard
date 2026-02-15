"use client"

import { useEffect, useState } from "react"

interface Announcement {
  id: number
  filing_time: string | null
  symbol: string
  Company_name: string
  description: string
  announcement: string
  attachment_url: string
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")

  async function fetchData() {
    try {
      const res = await fetch("/api/announcements")
      const data = await res.json()

      if (Array.isArray(data)) {
        setAnnouncements(data)
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const filteredAnnouncements = announcements
    .filter((item) => {
      if (filter === "All") return true
      return item.description
        ?.toLowerCase()
        .includes(filter.toLowerCase())
    })
    .filter((item) => {
      if (!search) return true
      return (
        item.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        item.Company_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      )
    })

  function formatDate(dateString: string | null) {
    if (!dateString) return "—"

    const date = new Date(dateString)

    if (isNaN(date.getTime())) return "—"

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        📊 NSE Announcements Dashboard
      </h1>

      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="🔍 Search by symbol, company, or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 shadow w-full md:w-1/2"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-2 shadow w-full md:w-1/4"
        >
          <option value="All">All</option>
          <option value="Board">Board Meeting</option>
          <option value="Press">Press Release</option>
          <option value="Dividend">Dividend</option>
          <option value="Results">Results</option>
          <option value="Outcome">Outcome</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Date & Time</th>
              <th className="p-3 text-left">Attachment</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-6">
                  Loading announcements...
                </td>
              </tr>
            ) : filteredAnnouncements.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-6">
                  No announcements found.
                </td>
              </tr>
            ) : (
              filteredAnnouncements.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">{item.symbol}</td>
                  <td className="p-3">{item.Company_name}</td>
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">
                    {formatDate(item.filing_time)}
                  </td>
                  <td className="p-3">
                    <a
                      href={item.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      View PDF
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
