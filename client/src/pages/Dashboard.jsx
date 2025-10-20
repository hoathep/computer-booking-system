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
    totalBookings: 0,
    totalComputers: 0,
    availableComputers: 0,
    partiallyAvailableComputers: 0,
    bookedComputers: 0,
    inUseComputers: 0,
    todayBookedHours: 0,
    monthUsedHours: 0
  })
  const [hotComputers, setHotComputers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('hot') // 'hot', 'available', or 'rating'
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const todayStr = new Date().toLocaleDateString('sv-SE')
      const [activeRes, allRes, hotRes, availabilityRes, timeStatsRes] = await Promise.all([
        axios.get('/api/bookings/active'),
        axios.get('/api/bookings/my-bookings'),
        axios.get('/api/computers/hot'),
        axios.get(`/api/computers/availability-stats?date=${todayStr}`),
        axios.get('/api/bookings/user-time-stats')
      ])

      setStats({
        activeBookings: activeRes.data,
        totalBookings: allRes.data.length,
        totalComputers: availabilityRes.data.totalComputers,
        availableComputers: availabilityRes.data.availableComputers,
        partiallyAvailableComputers: availabilityRes.data.partiallyAvailableComputers || 0,
        bookedComputers: availabilityRes.data.bookedComputers || 0,
        inUseComputers: availabilityRes.data.inUseComputers || 0,
        todayBookedHours: timeStatsRes.data.todayBookedHours,
        monthUsedHours: timeStatsRes.data.monthUsedHours
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
        <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
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
            <div className="pt-5">
              <p className="text-sm font-semibold text-gray-600">{t('dashboard.activeBookings')}</p>
              <p className="text-2xl font-bold text-primary-600">{stats.activeBookings.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg mt-3">
              <Monitor className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">{t('dashboard.availableComputers') || 'Trạng thái máy tính hôm nay'}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.availableComputers}</p>
                  <p className="text-xs text-gray-500">{t('dashboard.computerStatus.available')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.partiallyAvailableComputers}</p>
                  <p className="text-xs text-gray-500">{t('dashboard.computerStatus.partiallyAvailable')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.bookedComputers}</p>
                  <p className="text-xs text-gray-500">{t('dashboard.computerStatus.booked')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.inUseComputers}</p>
                  <p className="text-xs text-gray-500">{t('dashboard.computerStatus.inUse')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t('dashboard.computerStatus.total')}: {stats.totalComputers} {t('dashboard.computerStatus.machines')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">{t('dashboard.todayBookedHours') || 'Giờ đăng ký hôm nay'}</p>
              <p className="text-2xl font-bold text-orange-600">{stats.todayBookedHours}h</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('dashboard.monthUsedHours') || 'Đã sử dụng tháng này'}: {stats.monthUsedHours}h
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Current Bookings Section */}
        <div className="card min-h-[350px] sm:min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              <span className="hidden sm:inline">{t('dashboard.currentBookings')}</span>
              <span className="sm:hidden">Lịch đặt</span>
            </h2>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
              {stats.activeBookings.length} {t('dashboard.booked') || 'đặt'}
            </span>
          </div>
          
          <div className="flex-1">
            {stats.activeBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">{t('dashboard.noActiveBookings')}</p>
                <Link to="/computers" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 transition-colors">
                  <span>{t('dashboard.bookNow')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="h-80 overflow-y-auto scrollbar-thin">
                <div className="space-y-2 pr-2">
                  {stats.activeBookings.map((booking) => (
                    <div key={booking.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{booking.computer_name}</h3>
                            <span className="text-xs text-gray-500 flex-shrink-0">({booking.ip_address || 'N/A'})</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-2">{booking.location}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                {format(new Date(booking.start_time), 'HH:mm', { locale: vi })} - {format(new Date(booking.end_time), 'HH:mm', { locale: vi })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-purple-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{format(new Date(booking.start_time), 'dd/MM', { locale: vi })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'booked'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status === 'active' 
                              ? t('bookings.active')
                              : booking.status === 'booked'
                              ? t('bookings.booked')
                              : booking.status === 'completed'
                              ? t('bookings.completed')
                              : booking.status === 'cancelled'
                              ? t('bookings.cancelled')
                              : booking.status
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hot Computers Section */}
        <div className="card min-h-[350px] sm:min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary-600 flex-shrink-0" />
                <span className="hidden sm:inline">{t('dashboard.hotComputers') || 'Máy Hot'}</span>
                <span className="sm:hidden">Máy Hot</span>
              </h2>
              <span className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                {hotComputers.filter(computer => {
                  if (sortBy === 'available') return computer.status === 'available'
                  if (sortBy === 'rating') return computer.rating > 0
                  return true
                }).length} {t('dashboard.computerStatus.machines')}
              </span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setSortBy('hot')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  sortBy === 'hot' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                {t('dashboard.hot') || 'Book nhiều'}
              </button>
              <button
                onClick={() => setSortBy('available')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  sortBy === 'available' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {t('dashboard.available') || 'Rảnh'}
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  sortBy === 'rating' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="h-80 overflow-y-auto scrollbar-thin">
              {hotComputers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu máy tính</p>
                </div>
              ) : (
                <>
                  {hotComputers.filter(computer => {
                    if (sortBy === 'available') return computer.status === 'available'
                    if (sortBy === 'rating') return computer.rating > 0
                    return true
                  }).length > 5 && null}
                  <div className="space-y-2 pr-2">
                    {hotComputers
                      .filter(computer => {
                        if (sortBy === 'available') return computer.status === 'available'
                        if (sortBy === 'rating') return computer.rating > 0
                        return true
                      })
                      .sort((a, b) => {
                        if (sortBy === 'hot') return (b.booking_count || 0) - (a.booking_count || 0)
                        if (sortBy === 'available') return a.name.localeCompare(b.name)
                        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
                        return 0
                      })
                      .map((computer) => (
                        <div key={computer.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{computer.name}</h3>
                              <p className="text-sm text-gray-600 truncate mb-2">{computer.location}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-600">
                                    {computer.rating ? computer.rating.toFixed(1) : '0.0'} ({computer.rating_count || 0})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-600">{computer.booking_count || 0} lượt</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                computer.status === 'available' 
                                  ? 'bg-green-100 text-green-800' 
                                  : computer.status === 'maintenance'
                                  ? 'bg-orange-100 text-orange-800'
                                  : computer.status === 'disabled'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {computer.status === 'available' 
                                  ? t('dashboard.available') || 'Rảnh' 
                                  : computer.status === 'maintenance'
                                  ? t('computers.maintenance') || 'Bảo trì'
                                  : computer.status === 'disabled'
                                  ? t('computers.disabled') || 'Vô hiệu hóa'
                                  : t('dashboard.busy') || 'Bận'}
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
        </div>
      </div>

      {/* Guide Section */}
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
  )
}



