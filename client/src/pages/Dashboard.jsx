import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Monitor, Calendar, Clock, TrendingUp } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [activeRes, allRes] = await Promise.all([
        axios.get('/api/bookings/active'),
        axios.get('/api/bookings/my-bookings')
      ])

      setStats({
        activeBookings: activeRes.data,
        totalBookings: allRes.data.length
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
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
            <div className="space-y-3">
              {stats.activeBookings.map((booking) => (
                <div key={booking.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.computer_name}</h3>
                      <p className="text-sm text-gray-600">{booking.location}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                      Đang hoạt động
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Bắt đầu: {format(new Date(booking.start_time), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>
                    <p>Kết thúc: {format(new Date(booking.end_time), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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

// Removed embedded PasswordChange (now in topbar)
function PasswordChange({ onDone }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      onDone && onDone({ type: 'error', text: 'Mật khẩu mới phải ≥ 6 ký tự' })
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/change-password', { currentPassword, newPassword })
      onDone && onDone({ type: 'success', text: 'Đổi mật khẩu thành công' })
      setCurrentPassword(''); setNewPassword('')
    } catch (e) {
      onDone && onDone({ type: 'error', text: e.response?.data?.error || 'Đổi mật khẩu thất bại' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div>
        <label className="block text-sm text-gray-700 mb-1">Mật khẩu hiện tại</label>
        <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="input" />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">Mật khẩu mới</label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="input" required />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary text-sm">{loading ? '...' : 'Lưu mật khẩu'}</button>
    </form>
  )
}


