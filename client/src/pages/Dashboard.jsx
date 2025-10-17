import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Monitor, Calendar, Clock, TrendingUp, Star, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useTranslation } from '../hooks/useTranslation'

export default function Dashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    activeBookings: [],
    totalBookings: 0
  })
  const [hotComputers, setHotComputers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('hot') // 'hot' or 'available'
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [activeRes, allRes, hotRes] = await Promise.all([
        axios.get('/api/bookings/active'),
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/computers/hot')
      ])

      setStats({
        activeBookings: activeRes.data,
        totalBookings: allRes.data.length
      })
      setHotComputers(hotRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setMessage({ type: 'error', text: 'Không thể tải dữ liệu trang chủ' })
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard.welcome')}, {user?.fullname}!
        </h1>
        <p className="text-gray-600 mt-1">Chào mừng bạn đến với hệ thống đặt máy tính</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.activeBookings')}</p>
              <p className="text-3xl font-bold text-primary-600">{stats.activeBookings.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Monitor className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.totalBookings')}</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('dashboard.maxConcurrent')}</p>
              <p className="text-3xl font-bold text-orange-600">{user?.max_concurrent_bookings || 1}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary-600" />
            {t('dashboard.currentBookings')}
          </h2>
          
          {stats.activeBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>{t('dashboard.noActiveBookings')}</p>
              <Link to="/computers" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
                {t('dashboard.bookNow')}
              </Link>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-3 pr-2">
                {stats.activeBookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{booking.computer_name}</h3>
                          <span className="text-xs text-gray-500">({booking.ip_address || 'N/A'})</span>
                        </div>
                        <p className="text-sm text-gray-600">{booking.location}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        {t('dashboard.booked') || 'Đã được book'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Thời gian:</span> {format(new Date(booking.start_time), 'HH:mm', { locale: vi })} - {format(new Date(booking.end_time), 'HH:mm', { locale: vi })} ({format(new Date(booking.start_time), 'dd/MM', { locale: vi })})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                {t('dashboard.hotComputers') || 'Máy Hot'}
              </h2>
              <span className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {hotComputers.filter(computer => sortBy === 'available' ? computer.status === 'available' : true).length} máy
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('hot')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  sortBy === 'hot' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('dashboard.hot') || 'Hot'}
              </button>
              <button
                onClick={() => setSortBy('available')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  sortBy === 'available' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('dashboard.available') || 'Rảnh'}
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {hotComputers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Chưa có dữ liệu máy tính</p>
              </div>
            ) : (
              <>
                {hotComputers.filter(computer => sortBy === 'available' ? computer.status === 'available' : true).length > 5 && (
                  <div className="text-xs text-gray-500 mb-2 text-center">
                    Cuộn để xem thêm máy
                  </div>
                )}
                <div className="space-y-3 pr-2">
                {hotComputers
                  .filter(computer => sortBy === 'available' ? computer.status === 'available' : true)
                  .map((computer) => (
                    <div key={computer.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{computer.name}</h3>
                          <p className="text-sm text-gray-600">{computer.location}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">
                                {computer.rating ? computer.rating.toFixed(1) : '0.0'} ({computer.rating_count || 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-600">{computer.booking_count || 0} lượt</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            computer.status === 'available' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {computer.status === 'available' ? t('dashboard.available') || 'Rảnh' : t('dashboard.busy') || 'Bận'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

            <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.guide')}</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                1
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">{t('dashboard.step1')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.step1Desc')}</p>
              </div>
              {/* password change moved to topbar menu */}
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                2
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">{t('dashboard.step2')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.step2Desc')}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                3
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">{t('dashboard.step3')}</h3>
                <p className="text-sm text-gray-600">{t('dashboard.step3Desc')}</p>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
              <strong>{t('dashboard.note')}:</strong> {t('dashboard.noteText', { count: user?.max_concurrent_bookings || 1 })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



