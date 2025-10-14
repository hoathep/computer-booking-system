import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users2, Plus, Save, X } from 'lucide-react'

export default function AdminGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    group_name: '',
    max_concurrent_bookings: 1
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (group = null) => {
    if (group) {
      setFormData({
        group_name: group.group_name,
        max_concurrent_bookings: group.max_concurrent_bookings
      })
    } else {
      setFormData({
        group_name: '',
        max_concurrent_bookings: 1
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      await axios.post('/api/admin/groups', formData)
      setMessage({ type: 'success', text: 'Lưu nhóm thành công!' })
      setShowModal(false)
      fetchGroups()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Có lỗi xảy ra!' })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhóm</h1>
          <p className="text-gray-600 mt-1">Quản lý nhóm người dùng và giới hạn booking</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Thêm Nhóm
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="card hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleOpenModal(group)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-lg text-gray-900">{group.group_name}</h3>
                  <p className="text-sm text-gray-600">Nhóm người dùng</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Giới hạn booking:</span>
                <span className="text-2xl font-bold text-purple-600">{group.max_concurrent_bookings}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">máy cùng lúc</p>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 card">
          <Users2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Chưa có nhóm nào</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thêm/Sửa Nhóm
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                <input
                  type="text"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="input"
                  placeholder="vip, premium, default..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới hạn booking đồng thời
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_concurrent_bookings}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_bookings: parseInt(e.target.value) })}
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Số máy tối đa mà người dùng trong nhóm này có thể đặt cùng lúc
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                <strong>Lưu ý:</strong> Nếu user có giới hạn riêng (khác 0), giới hạn cá nhân sẽ được ưu tiên.
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


