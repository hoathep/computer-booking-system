import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Calendar, Monitor, Clock, Trash2, CheckCircle, XCircle, AlertCircle, Star, Network } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function MyBookings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rating, setRating] = useState(0)

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

  const canRateBooking = (booking) => {
    if (booking.status !== 'completed') return false
    
    const bookingEndTime = new Date(booking.end_time)
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    
    return bookingEndTime >= fiveDaysAgo
  }

  const handleRateBooking = (booking) => {
    setSelectedBooking(booking)
    setRating(booking.existing_rating || 0)
    setShowRatingModal(true)
  }

  const handleRatingSubmit = async () => {
    if (!rating || !selectedBooking) return
    
    try {
      await axios.post(`/api/computers/${selectedBooking.computer_id}/rate`, { 
        rating, 
        bookingId: selectedBooking.id 
      })
      setMessage({ type: 'success', text: 'Đánh giá thành công!' })
      setShowRatingModal(false)
      setSelectedBooking(null)
      setRating(0)
      fetchBookings() // Refresh to show updated rating
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Đánh giá thất bại' })
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
    if (status === 'booked' && now >= start && now <= end) {
      actualStatus = 'active'
    } else if (status === 'active' && now > end) {
      actualStatus = 'completed'
    }
    
    const statusConfig = {
      booked: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('bookings.booked'), icon: CheckCircle },
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('bookings.active'), icon: CheckCircle },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('bookings.completed'), icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: t('bookings.cancelled'), icon: XCircle }
    }

    const config = statusConfig[actualStatus] || statusConfig.booked
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
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('bookings.title')}</h1>
            <p className="text-gray-600 mt-1">{t('bookings.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary-600" />
            <span className="text-sm text-gray-500">{bookings.length} {t('bookings.totalBookings')}</span>
          </div>
        </div>
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('bookings.noBookings')}</h3>
          <p className="text-gray-500 mb-6">Bắt đầu đặt máy để quản lý lịch của bạn</p>
          <button className="btn btn-primary inline-flex items-center" onClick={() => navigate('/computers')}>
            <Monitor className="h-4 w-4 mr-2" />
            {t('dashboard.bookNow')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  {/* Left side - Computer info */}
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Monitor className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{booking.computer_name}</h3>
                          <p className="text-xs text-gray-500">{booking.location}</p>
                        </div>
                        
                        {/* Time */}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {format(new Date(booking.start_time), 'HH:mm', { locale: vi })} - {format(new Date(booking.end_time), 'HH:mm', { locale: vi })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(booking.start_time), 'dd/MM', { locale: vi })}
                          </span>
                        </div>

                        {/* IP Address */}
                        <div className="flex items-center space-x-1">
                          <Network className="h-3 w-3 text-blue-500" />
                          <span className="font-mono text-xs text-gray-900">{booking.ip_address || 'N/A'}</span>
                        </div>

                        {/* Password */}
                        {booking.unlock_code && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">{t('bookings.password')}:</span>
                            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded border">
                              {booking.unlock_code}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Status and Actions */}
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(booking.status, booking.start_time, booking.end_time)}
                    
                    {/* Cancel button */}
                    {(booking.status === 'booked' || booking.status === 'active') && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('bookings.cancelBooking')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Rate button */}
                    {canRateBooking(booking) && (
                      <button
                        onClick={() => handleRateBooking(booking)}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title={booking.existing_rating ? t('bookings.updateRating') : t('bookings.rateBooking')}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedBooking.existing_rating ? t('bookings.updateRating') : t('bookings.rateBooking')} - {selectedBooking.computer_name}
            </h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                >
                  <Star className="h-8 w-8" fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRatingSubmit}
                disabled={!rating}
                className="btn btn-primary flex-1"
              >
                {selectedBooking.existing_rating ? t('bookings.updateRating') : t('bookings.submitRating')}
              </button>
              <button
                onClick={() => {
                  setShowRatingModal(false)
                  setSelectedBooking(null)
                  setRating(0)
                }}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


