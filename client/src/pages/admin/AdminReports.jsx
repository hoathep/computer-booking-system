import { useEffect, useState } from 'react'
import axios from 'axios'
import ResizableTable from '../../components/ResizableTable'
import { useTranslation } from '../../hooks/useTranslation'
import { Calendar } from 'lucide-react'

export default function AdminReports() {
  const { t } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('user') // 'user' | 'group'
  const [data, setData] = useState({ totals: { bookings: 0, bookedHours: 0, usedHours: 0, noShowHours: 0 }, users: [], groups: [] })
  const [tsBucket, setTsBucket] = useState('day') // hour | day | week | month
  const [tsMode, setTsMode] = useState('user') // user | group | computer
  const [tsLoading, setTsLoading] = useState(false)
  const [tsError, setTsError] = useState('')
  const [tsData, setTsData] = useState({ buckets: [], series: [], mode: 'user', bucket: 'day' })
  const [tsSelectedLabel, setTsSelectedLabel] = useState('all')
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)

  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return ''
    // Convert dd/mm/yyyy hh:mm to YYYY-MM-DDTHH:mm:ss
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
    if (match) {
      const [, day, month, year, hour, minute] = match
      return `${year}-${month}-${day}T${hour}:${minute}:00`
    }
    return dateStr
  }

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (from) params.from = formatDateForAPI(from)
      if (to) params.to = formatDateForAPI(to)
      const url = mode === 'group' ? '/api/admin/reports/usage-by-group' : '/api/admin/reports/usage'
      const res = await axios.get(url, { params })
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeseries = async () => {
    setTsLoading(true)
    setTsError('')
    try {
      const params = { mode: tsMode, bucket: tsBucket }
      if (from) params.from = formatDateForAPI(from)
      if (to) params.to = formatDateForAPI(to)
      const res = await axios.get('/api/admin/reports/usage-timeseries', { params })
      setTsData(res.data)
    } catch (e) {
      setTsError(e.response?.data?.error || 'Không thể tải biểu đồ')
    } finally {
      setTsLoading(false)
    }
  }

  useEffect(() => {
    // default: last 7 days
    const end = new Date()
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    
    setFrom(formatDate(start))
    setTo(formatDate(end))
  }, [])

  useEffect(() => {
    if (from && to) fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, mode])

  useEffect(() => {
    if (from && to) fetchTimeseries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, tsMode, tsBucket])

  return (
    <div className="space-y-6">
      {/* Time-series chart at top */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-bold">{t('admin.ui.chartTitle') || 'Biểu đồ theo thời gian'}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Tabs: User / Group / Computer */}
            <div className="inline-flex rounded-lg overflow-hidden border shrink-0">
              <button className={`px-3 py-1.5 text-sm ${tsMode === 'user' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => setTsMode('user')}>{t('admin.ui.byUser') || 'Theo User'}</button>
              <button className={`px-3 py-1.5 text-sm ${tsMode === 'group' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => setTsMode('group')}>{t('admin.ui.byGroup') || 'Theo Group'}</button>
              <button className={`px-3 py-1.5 text-sm ${tsMode === 'computer' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => setTsMode('computer')}>{t('admin.ui.byComputer') || 'Theo Máy'}</button>
            </div>
            {/* Bucket selector */}
            <div className="inline-flex rounded-lg overflow-hidden border shrink-0">
              <button className={`px-3 py-1.5 text-sm ${tsBucket === 'day' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setTsBucket('day')}>{t('admin.ui.day') || 'Ngày'}</button>
              <button className={`px-3 py-1.5 text-sm ${tsBucket === 'week' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setTsBucket('week')}>{t('admin.ui.week') || 'Tuần'}</button>
              <button className={`px-3 py-1.5 text-sm ${tsBucket === 'month' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setTsBucket('month')}>{t('admin.ui.month') || 'Tháng'}</button>
              <button className={`px-3 py-1.5 text-sm ${tsBucket === 'year' ? 'bg-gray-900 text-white' : 'bg-white'}`} onClick={() => setTsBucket('year')}>{t('admin.ui.year') || 'Năm'}</button>
            </div>
            {/* Label selector */}
            <div className="min-w-[180px] sm:min-w-[220px]">
              <select className="input h-9 w-full" value={tsSelectedLabel} onChange={e => setTsSelectedLabel(e.target.value)}>
                <option value="all">{t('common.all') || 'Tất cả'}</option>
                {(tsData.series || []).map(s => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {tsError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{tsError}</div>}
        <div className="overflow-x-auto">
          <TimeseriesChart
            data={{
              ...tsData,
              series: tsSelectedLabel === 'all' ? tsData.series : (tsData.series || []).filter(s => s.label === tsSelectedLabel)
            }}
            loading={tsLoading}
            height={280}
            xLabel={tsBucket === 'day' ? (t('admin.ui.day') || 'Ngày') : tsBucket === 'week' ? (t('admin.ui.week') || 'Tuần') : tsBucket === 'month' ? (t('admin.ui.month') || 'Tháng') : (t('admin.ui.year') || 'Năm')}
            yLabel={t('reports.bookedHours') || 'Giờ đặt'}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.quickReports') || 'Báo Cáo Nhanh'}</h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg overflow-hidden border">
            <button className={`px-3 py-1.5 text-sm ${mode === 'user' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => setMode('user')}>{t('admin.ui.byUser') || 'Theo User'}</button>
            <button className={`px-3 py-1.5 text-sm ${mode === 'group' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => setMode('group')}>{t('admin.ui.byGroup') || 'Theo Group'}</button>
          </div>
          <button onClick={async () => {
            try {
              const params = new URLSearchParams();
              params.append('mode', mode);
              if (from) params.append('from', formatDateForAPI(from));
              if (to) params.append('to', formatDateForAPI(to));
              const res = await axios.get(`/api/admin/reports/export-summary?${params.toString()}`, { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement('a');
              a.href = url;
              a.download = `summary_report_${mode}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
              alert('Xuất báo cáo thất bại');
            }
          }} className="btn btn-secondary">{t('admin.ui.export') || 'Xuất'}</button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.from') || 'Từ'}</label>
          <div className="relative">
            <input type="text" value={from} onChange={e => setFrom(e.target.value)} className="input" placeholder="dd/mm/yyyy hh:mm" />
            <button onClick={() => setShowFromCalendar(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <Calendar className="h-4 w-4" />
            </button>
            {showFromCalendar && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
                <input type="date" value={from.split('T')[0]} onChange={e => {
                  const date = new Date(e.target.value)
                  const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} 00:00`
                  setFrom(formatted)
                  setShowFromCalendar(false)
                }} className="p-2 border-0" />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.to') || 'Đến'}</label>
          <div className="relative">
            <input type="text" value={to} onChange={e => setTo(e.target.value)} className="input" placeholder="dd/mm/yyyy hh:mm" />
            <button onClick={() => setShowToCalendar(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              <Calendar className="h-4 w-4" />
            </button>
            {showToCalendar && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
                <input type="date" value={to.split('T')[0]} onChange={e => {
                  const date = new Date(e.target.value)
                  const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} 23:59`
                  setTo(formatted)
                  setShowToCalendar(false)
                }} className="p-2 border-0" />
              </div>
            )}
          </div>
        </div>
        <button onClick={fetchReport} className="btn btn-primary">{t('reports.load') || 'Tải báo cáo'}</button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">{t('common.summary') || 'Tổng hợp'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('reports.bookings') || 'Số booking'}</div>
            <div className="text-xl font-bold">{data.totals.bookings}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('reports.bookedHours') || 'Giờ đặt'}</div>
            <div className="text-xl font-bold">{data.totals.bookedHours}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('reports.usedHours') || 'Giờ sử dụng'}</div>
            <div className="text-xl font-bold">{data.totals.usedHours}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{t('reports.noShowHours') || 'Không dùng'}</div>
            <div className="text-xl font-bold">{data.totals.noShowHours}</div>
          </div>
        </div>
      </div>

      {mode === 'user' ? (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <ResizableTable>
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-50 text-center text-sm">
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.user') || 'User'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.fullname') || 'Họ tên'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.bookings') || 'Số booking'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.bookedHours') || 'Giờ đặt'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.usedHours') || 'Giờ sử dụng'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.noShowHours') || 'Không dùng'}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td className="px-4 py-3" colSpan={6}>Đang tải...</td></tr>
              ) : (
                (Array.isArray(data.users) ? data.users : []).map(u => (
                  <tr key={u.userId} className="border-t">
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.username}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.fullname}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.bookings}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.bookedHours}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.usedHours}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{u.noShowHours}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </ResizableTable>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <ResizableTable>
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-50 text-center text-sm">
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.groupName') || 'Group'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.bookings') || 'Số booking'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.bookedHours') || 'Giờ đặt'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.usedHours') || 'Giờ sử dụng'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('reports.noShowHours') || 'Không dùng'}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td className="px-4 py-3" colSpan={5}>Đang tải...</td></tr>
              ) : (
                (Array.isArray(data.groups) ? data.groups : []).map(g => (
                  <tr key={g.groupName} className="border-t">
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{g.groupName}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{g.bookings}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{g.bookedHours}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{g.usedHours}</td>
                    <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{g.noShowHours}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </ResizableTable>
        </div>
      )}

      {/* end chart */}
    </div>
  )
}

function TimeseriesChart({ data, loading, height = 240, xLabel = 'Thời gian', yLabel = 'Số lượng' }) {
  if (loading) return <div className="px-2 py-4 text-sm">Đang tải biểu đồ...</div>
  const { buckets = [], series = [] } = data || {}
  const width = Math.max(600, buckets.length * 60)
  const padding = { left: 40, right: 20, top: 10, bottom: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  // compute max value
  const maxY = Math.max(1, ...series.flatMap(s => s.data))
  const xStep = buckets.length ? innerW / buckets.length : innerW
  const barWidth = buckets.length && series.length ? Math.max(6, (xStep - 10) / series.length) : 20

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <svg width={width} height={height} className="min-w-full">
      {/* axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" />

      {/* y ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padding.top + innerH * (1 - t)
        const val = Math.round(maxY * t)
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" />
            <text x={padding.left - 6} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#6b7280">{val}</text>
          </g>
        )
      })}

      {/* bars */}
      {buckets.map((b, bi) => {
        const x0 = padding.left + bi * xStep + 5
        return (
          <g key={b}>
            {series.map((s, si) => {
              const value = s.data[bi] || 0
              const h = (value / maxY) * innerH
              const x = x0 + si * barWidth
              const y = padding.top + innerH - h
              return <rect key={si} x={x} y={y} width={barWidth - 2} height={h} fill={colors[si % colors.length]} rx={2} />
            })}
            {/* x labels */}
            <text x={x0 + (series.length * barWidth) / 2} y={height - padding.bottom + 16} textAnchor="middle" fontSize="10" fill="#6b7280">{b}</text>
          </g>
        )
      })}

      {/* axis labels */}
      <text x={(padding.left + width - padding.right) / 2} y={height - 6} textAnchor="middle" fontSize="12" fill="#374151">{xLabel}</text>
      <text x={14} y={(padding.top + height - padding.bottom) / 2} textAnchor="middle" fontSize="12" fill="#374151" transform={`rotate(-90 14 ${(padding.top + height - padding.bottom) / 2})`}>{yLabel}</text>

      {/* legend */}
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {series.slice(0, 8).map((s, i) => (
          <g key={s.label} transform={`translate(${i * 120}, 0)`}>
            <rect x={0} y={-8} width={10} height={10} fill={colors[i % colors.length]} rx={2} />
            <text x={16} y={0} fontSize="11" fill="#374151">{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}
