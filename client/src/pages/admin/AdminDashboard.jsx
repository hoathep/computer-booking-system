import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Monitor, Calendar, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComputers: 0,
    activeBookings: 0,
    todayBookings: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    fetchStats()
    fetchDebugInfo()
  }, [])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await axios.get('/api/admin/stats')
      console.log('Stats response:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setError(error.response?.data?.error || 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchDebugInfo = async () => {
    try {
      const response = await axios.get('/api/admin/debug')
      console.log('Debug info:', response.data)
      setDebugInfo(response.data)
    } catch (error) {
      console.error('Failed to fetch debug info:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hệ thống</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <strong>Debug Info:</strong>
          <div className="mt-2 text-sm">
            <p>Users: {debugInfo.counts.totalUsers} (Admin: {debugInfo.users.filter(u => u.role === 'admin').length})</p>
            <p>Computers: {debugInfo.counts.totalComputers}</p>
            <p>Bookings: {debugInfo.counts.totalBookings}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tổng Users</p>
              <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Users className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Tổng Máy</p>
              <p className="text-4xl font-bold mt-2">{stats.totalComputers}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Monitor className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Đang hoạt động</p>
              <p className="text-4xl font-bold mt-2">{stats.activeBookings}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Calendar className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Đặt hôm nay</p>
              <p className="text-4xl font-bold mt-2">{stats.todayBookings}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <TrendingUp className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hướng dẫn quản trị</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                1
              </div>
              <div className="ml-3">
                <strong>Quản lý Users:</strong> Thêm, sửa, xóa người dùng và đặt giới hạn booking
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                2
              </div>
              <div className="ml-3">
                <strong>Quản lý Máy:</strong> Thêm, sửa, xóa máy tính và cập nhật trạng thái
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                3
              </div>
              <div className="ml-3">
                <strong>Quản lý Nhóm:</strong> Tạo nhóm và đặt giới hạn booking cho từng nhóm
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin hệ thống</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Phiên bản:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Backend:</span>
              <span className="font-medium">Node.js + Express</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Database:</span>
              <span className="font-medium">SQLite</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Frontend:</span>
              <span className="font-medium">React + Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


