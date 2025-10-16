import { useState, useEffect } from 'react'
import axios from 'axios'
import { Monitor, Edit2, Trash2, Save, X } from 'lucide-react'
import ResizableTable from '../../components/ResizableTable'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminComputers() {
  const { t } = useTranslation()
  const [computers, setComputers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingComputer, setEditingComputer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    status: 'available',
    ip_address: '',
    mac_address: '',
    preferred_group: [],
    memory_gb: '',
    recommended_software: ''
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchComputers()
    fetchGroups()
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

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
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
        mac_address: computer.mac_address || '',
        preferred_group: Array.isArray(computer.preferred_group)
          ? computer.preferred_group
          : (computer.preferred_group ? String(computer.preferred_group).split(',').map(s => s.trim()).filter(Boolean) : [])
        ,
        memory_gb: computer.memory_gb ?? '',
        recommended_software: computer.recommended_software || ''
      })
    } else {
      setEditingComputer(null)
      setFormData({
        name: '',
        description: '',
        location: '',
        status: 'available',
        ip_address: '',
        mac_address: '',
        preferred_group: [],
        memory_gb: '',
        recommended_software: ''
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.computers')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.computerManagement')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              const res = await axios.get('/api/admin/computers/export', { responseType: 'blob' })
              const url = window.URL.createObjectURL(new Blob([res.data]))
              const a = document.createElement('a'); a.href = url; a.download = 'computers-export.json'; a.click();
              window.URL.revokeObjectURL(url)
            } catch (e) { console.error('Export failed', e) }
          }} className="btn btn-secondary">{t('admin.ui.export') || 'Export'}</button>
          <label className="btn btn-secondary cursor-pointer">
            {t('admin.ui.import') || 'Import'}
            <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              try {
                const text = await file.text();
                const json = JSON.parse(text);
                await axios.post('/api/admin/computers/import', json)
                fetchComputers()
                setMessage({ type: 'success', text: 'Import computers thành công!' })
              } catch (err) {
                console.error(err)
                setMessage({ type: 'error', text: err.response?.data?.error || 'Import thất bại!' })
              } finally {
                e.target.value = ''
              }
            }} />
          </label>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">{t('admin.addComputer')}</button>
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

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <ResizableTable>
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-50 text-center text-sm">
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('computers.computerName') || 'Tên máy'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.status') || 'Trạng thái'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('common.location') || 'Vị trí'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.ip') || 'IP'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.preferredGroup') || 'Nhóm ưu tiên'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.memoryGb') || 'Bộ nhớ (GB)'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.description') || 'Mô tả'}</th>
              <th className="px-4 py-2 text-right border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.actions') || 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {computers.map((computer) => (
              <tr key={computer.id} className="border-t">
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-md ${computer.status === 'available' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Monitor className={`h-4 w-4 ${computer.status === 'available' ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="font-medium text-gray-900">{computer.name}</div>
                  </div>
                </td>
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    computer.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {computer.status}
                  </span>
                </td>
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{computer.location || '-'}</td>
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{computer.ip_address || '-'}</td>
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{computer.preferred_group || '-'}</td>
                <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{computer.memory_gb ?? '-'}</td>
                <td className="px-4 py-2 max-w-[280px] truncate border-r border-gray-100 last:border-r-0" title={computer.description || ''}>{computer.description || '-'}</td>
                <td className="px-4 py-2 text-right border-r border-gray-100 last:border-r-0">
                  <div className="inline-flex gap-2">
                    <button onClick={() => handleOpenModal(computer)} className="btn btn-secondary inline-flex items-center">
                      <Edit2 className="h-4 w-4 mr-1" /> Sửa
                    </button>
                    <button onClick={() => handleDelete(computer.id)} className="btn btn-danger inline-flex items-center">
                      <Trash2 className="h-4 w-4 mr-1" /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </ResizableTable>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm ưu tiên sử dụng</label>
                <select
                  multiple
                  value={formData.preferred_group}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                    setFormData({ ...formData, preferred_group: opts })
                  }}
                  className="input h-28"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.group_name}>{g.group_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Giữ Ctrl/⌘ để chọn nhiều nhóm</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bộ nhớ (GB)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.memory_gb}
                  onChange={(e) => setFormData({ ...formData, memory_gb: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="input"
                  placeholder="Ví dụ: 16"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chạy Phân Tích</label>
                <textarea
                  value={formData.recommended_software}
                  onChange={(e) => setFormData({ ...formData, recommended_software: e.target.value })}
                  className="input"
                  placeholder="Danh sách chạy phân tích"
                  rows={3}
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


