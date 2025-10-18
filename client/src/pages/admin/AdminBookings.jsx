import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Trash2, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import ResizableTable from '../../components/ResizableTable'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminBookings() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState(null)
  const [advanceDays, setAdvanceDays] = useState(7)
  const [savingAdvance, setSavingAdvance] = useState(false)

  useEffect(() => {
    fetchBookings()
    fetchSettings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [filter, bookings])

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/admin/bookings')
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = () => {
    if (filter === 'all') {
      setFilteredBookings(bookings)
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filter))
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings')
      setAdvanceDays(res.data.maxAdvanceDays ?? 7)
    } catch (e) {
      // ignore
    }
  }

  const saveAdvanceDays = async () => {
    setSavingAdvance(true)
    try {
      await axios.post('/api/admin/settings', { maxAdvanceDays: parseInt(advanceDays) || 0 })
      setMessage({ type: 'success', text: t('admin.ui.advanceDaysSaved') })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || t('admin.ui.saveFailed') })
    } finally {
      setSavingAdvance(false)
    }
  }

  const handleDelete = async (bookingId) => {
    if (!confirm('Bạn có chắc muốn xóa booking này?')) return

    try {
      await axios.delete(`/api/admin/bookings/${bookingId}`)
      setMessage({ type: 'success', text: 'Xóa booking thành công!' })
      fetchBookings()
    } catch (error) {
      setMessage({ type: 'error', text: 'Xóa booking thất bại!' })
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      booked: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Đã đặt' },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Hoàn thành' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' }
    }

    const config = statusConfig[status] || statusConfig.booked

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.bookings')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.bookingManagement')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input py-2"
          >
            <option value="all">{t('common.all')}</option>
            <option value="booked">{t('bookings.booked')}</option>
            <option value="active">{t('bookings.active')}</option>
            <option value="completed">{t('bookings.completed')}</option>
            <option value="cancelled">{t('bookings.cancelled')}</option>
          </select>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings: Max advance days */}
      <div className="card p-4 flex items-center gap-3">
        <span className="text-sm text-gray-700">{t('admin.ui.maxAdvanceDays')}:</span>
        <input type="number" min="0" max="365" value={advanceDays} onChange={e => setAdvanceDays(e.target.value)} className="input h-9 w-24" />
        <button onClick={saveAdvanceDays} disabled={savingAdvance} className="btn btn-secondary h-9">{savingAdvance ? '...' : t('common.save')}</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <ResizableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 text-center text-sm">
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.bookingId')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.user')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.computerName')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.location')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.start')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.end')}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.status')}</th>
                <th className="px-4 py-2 text-right border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100 last:border-r-0">#{booking.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                    <div className="text-sm font-medium text-gray-900">{booking.fullname}</div>
                    <div className="text-xs text-gray-500">{booking.username}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100 last:border-r-0">{booking.computer_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 last:border-r-0">{booking.location}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 last:border-r-0">
                    {format(new Date(booking.start_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 border-r border-gray-100 last:border-r-0">
                    {format(new Date(booking.end_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right border-r border-gray-100 last:border-r-0">
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </ResizableTable>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">{t('admin.ui.noData')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {filteredBookings.length} / {bookings.length}
      </div>
    </div>
  )
}


