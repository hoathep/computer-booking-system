import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Monitor, Clock, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function MyBookings() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchBookings()
    
    // Auto refresh every 30 seconds to update status
    const interval = setInterval(() => {
      fetchBookings()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings/my-bookings')
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm(t('bookings.cancelConfirm'))) return

    try {
      await axios.delete(`/api/bookings/${bookingId}`)
      setMessage({ type: 'success', text: t('bookings.cancelSuccess') })
      fetchBookings()
    } catch (error) {
      setMessage({ type: 'error', text: t('bookings.cancelError') })
    }
  }

  const getStatusBadge = (status, startTime, endTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    // Determine actual status based on time
    let actualStatus = status
    if (status === 'pending' && now >= start && now <= end) {
      actualStatus = 'active'
    } else if (status === 'active' && now > end) {
      actualStatus = 'completed'
    }
    
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('bookings.pending'), icon: Clock },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('bookings.active'), icon: CheckCircle },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('bookings.completed'), icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: t('bookings.cancelled'), icon: XCircle }
    }

    const config = statusConfig[actualStatus] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('bookings.title')}</h1>
        <p className="text-gray-600 mt-1">{t('bookings.subtitle')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-12 card">
          <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{t('bookings.noBookings')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Monitor className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{booking.computer_name}</h3>
                      {getStatusBadge(booking.status, booking.start_time, booking.end_time)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{booking.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('common.location')}:</p>
                        <p className="font-medium text-gray-900">{booking.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('bookings.startTime')}:</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(booking.start_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('bookings.endTime')}:</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(booking.end_time), 'HH:mm dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('bookings.createdAt')}:</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(booking.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(booking.status === 'pending' || booking.status === 'active') && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn btn-danger ml-4"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('bookings.cancelBooking')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


