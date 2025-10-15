import { useEffect, useState } from 'react'
import axios from 'axios'

export default function AdminReports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ totals: { bookings: 0, bookedHours: 0, usedHours: 0, noShowHours: 0 }, users: [] })

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      const res = await axios.get('/api/admin/reports/usage', { params })
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // default: last 7 days
    const end = new Date()
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const toIso = end.toISOString().slice(0, 19)
    const fromIso = start.toISOString().slice(0, 19)
    setFrom(fromIso)
    setTo(toIso)
  }, [])

  useEffect(() => {
    if (from && to) fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Từ</label>
          <input type="text" value={from} onChange={e => setFrom(e.target.value)} className="input" placeholder="YYYY-MM-DDTHH:mm:ss" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Đến</label>
          <input type="text" value={to} onChange={e => setTo(e.target.value)} className="input" placeholder="YYYY-MM-DDTHH:mm:ss" />
        </div>
        <button onClick={fetchReport} className="btn btn-primary">Tải báo cáo</button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Tổng hợp</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Số booking</div>
            <div className="text-xl font-bold">{data.totals.bookings}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Giờ đặt</div>
            <div className="text-xl font-bold">{data.totals.bookedHours}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Giờ sử dụng</div>
            <div className="text-xl font-bold">{data.totals.usedHours}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Không dùng</div>
            <div className="text-xl font-bold">{data.totals.noShowHours}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm">
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Họ tên</th>
              <th className="px-4 py-2">Số booking</th>
              <th className="px-4 py-2">Giờ đặt</th>
              <th className="px-4 py-2">Giờ sử dụng</th>
              <th className="px-4 py-2">Không dùng</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={6}>Đang tải...</td></tr>
            ) : (
              data.users.map(u => (
                <tr key={u.userId} className="border-t">
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.fullname}</td>
                  <td className="px-4 py-2">{u.bookings}</td>
                  <td className="px-4 py-2">{u.bookedHours}</td>
                  <td className="px-4 py-2">{u.usedHours}</td>
                  <td className="px-4 py-2">{u.noShowHours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
