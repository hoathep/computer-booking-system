import { useState, useEffect } from 'react'
import axios from 'axios'
import { Monitor, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function AdminComputers() {
  const [computers, setComputers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingComputer, setEditingComputer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    status: 'available',
    ip_address: '',
    mac_address: ''
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchComputers()
  }, [])

  const fetchComputers = async () => {
    try {
      const response = await axios.get('/api/admin/computers')
      setComputers(response.data)
    } catch (error) {
      console.error('Failed to fetch computers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (computer = null) => {
    if (computer) {
      setEditingComputer(computer)
      setFormData({
        name: computer.name,
        description: computer.description || '',
        location: computer.location || '',
        status: computer.status,
        ip_address: computer.ip_address || '',
        mac_address: computer.mac_address || ''
      })
    } else {
      setEditingComputer(null)
      setFormData({
        name: '',
        description: '',
        location: '',
        status: 'available',
        ip_address: '',
        mac_address: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      if (editingComputer) {
        await axios.put(`/api/admin/computers/${editingComputer.id}`, formData)
        setMessage({ type: 'success', text: 'Cập nhật máy thành công!' })
      } else {
        await axios.post('/api/admin/computers', formData)
        setMessage({ type: 'success', text: 'Thêm máy thành công!' })
      }
      setShowModal(false)
      fetchComputers()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Có lỗi xảy ra!' })
    }
  }

  const handleDelete = async (computerId) => {
    if (!confirm('Bạn có chắc muốn xóa máy này?')) return

    try {
      await axios.delete(`/api/admin/computers/${computerId}`)
      setMessage({ type: 'success', text: 'Xóa máy thành công!' })
      fetchComputers()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Xóa máy thất bại!' })
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Máy tính</h1>
          <p className="text-gray-600 mt-1">Quản lý danh sách máy tính</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Thêm Máy
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
        {computers.map((computer) => (
          <div key={computer.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  computer.status === 'available' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Monitor className={`h-6 w-6 ${
                    computer.status === 'available' ? 'text-green-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-lg text-gray-900">{computer.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    computer.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {computer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><strong>Mô tả:</strong> {computer.description || '-'}</p>
              <p><strong>Vị trí:</strong> {computer.location || '-'}</p>
              <p><strong>IP:</strong> {computer.ip_address || '-'}</p>
              <p><strong>MAC:</strong> {computer.mac_address || '-'}</p>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <button
                onClick={() => handleOpenModal(computer)}
                className="btn btn-secondary flex-1"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Sửa
              </button>
              <button
                onClick={() => handleDelete(computer.id)}
                className="btn btn-danger flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingComputer ? 'Sửa Máy' : 'Thêm Máy'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên máy</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  className="input"
                  placeholder="192.168.1.100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
                <input
                  type="text"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  className="input"
                  placeholder="00:11:22:33:44:55"
                />
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


