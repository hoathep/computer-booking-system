import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users2, Save, X, Trash2, Edit2, Download, Upload } from 'lucide-react'
import ResizableTable from '../../components/ResizableTable'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminGroups() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [formData, setFormData] = useState({
    group_name: '',
    max_concurrent_bookings: 1,
    no_show_minutes: 15
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          axios.get('/api/admin/groups'),
          axios.get('/api/admin/users')
        ])
        setGroups(groupsRes.data)
        setUsers(usersRes.data)
      } catch (error) {
        console.error('Failed to fetch initial groups/users:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
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
        max_concurrent_bookings: group.max_concurrent_bookings,
        no_show_minutes: group.no_show_minutes ?? 15
      })
    } else {
      setFormData({
        group_name: '',
        max_concurrent_bookings: 1,
        no_show_minutes: 15
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

  const handleDeleteGroup = async (groupName) => {
    if (!confirm(`Xoá nhóm "${groupName}"? Tất cả user trong nhóm sẽ chuyển về 'default'.`)) return
    try {
      await axios.delete(`/api/admin/groups/${encodeURIComponent(groupName)}`)
      setMessage({ type: 'success', text: 'Đã xoá nhóm và chuyển user về default' })
      fetchGroups()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Xoá nhóm thất bại!' })
    }
  }

  const handleExportGroups = async () => {
    try {
      const response = await axios.get('/api/admin/groups/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `groups_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: t('admin.importExport.exportSuccess') })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('admin.importExport.exportError') })
    }
  }

  const handleImportFile = (event) => {
    const file = event.target.files[0]
    if (file) {
      setImportFile(file)
    }
  }

  const handleImportGroups = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: t('admin.importExport.selectFile') })
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      
      await axios.post('/api/admin/groups/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setMessage({ type: 'success', text: t('admin.importExport.importSuccess') })
      setShowImportModal(false)
      setImportFile(null)
      fetchGroups()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || t('admin.importExport.importError') })
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.groups')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.groupManagement')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportGroups} className="btn btn-secondary inline-flex items-center">
            <Download className="h-4 w-4 mr-2" />
            {t('admin.ui.export')}
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary inline-flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            {t('admin.ui.import')}
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">{t('admin.addGroup')}</button>
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
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.groupName') || 'Nhóm'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.totalUsers') || 'Tổng user'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.active') || 'Active'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.banned') || 'Banned'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.bookingLimit') || 'Giới hạn booking'}</th>
              <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.noShowMinutes') || 'Huỷ đặt sau (phút)'}</th>
              <th className="px-4 py-2 text-right border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.actions') || 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {groups.map((group) => {
              const stats = users.reduce((acc, u) => {
                if ((u.group_name || 'default') === group.group_name) {
                  acc.total += 1
                  if (u.banned) acc.banned += 1
                  else acc.active += 1
                }
                return acc
              }, { total: 0, active: 0, banned: 0 })
              return (
                <tr key={group.id} className="border-t">
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-md">
                        <Users2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="font-medium text-gray-900">{group.group_name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{stats.total}</td>
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{stats.active}</td>
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{stats.banned}</td>
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{group.max_concurrent_bookings}</td>
                  <td className="px-4 py-2 border-r border-gray-100 last:border-r-0">{group.no_show_minutes ?? 15}</td>
                  <td className="px-4 py-2 text-right border-r border-gray-100 last:border-r-0">
                    <div className="inline-flex gap-2">
                      <button onClick={() => handleOpenModal(group)} className="btn btn-secondary inline-flex items-center">
                        <Edit2 className="h-4 w-4 mr-1" /> Sửa
                      </button>
                      {group.group_name !== 'default' && (
                        <button onClick={() => handleDeleteGroup(group.group_name)} className="btn btn-danger inline-flex items-center">
                          <Trash2 className="h-4 w-4 mr-1" /> Xoá
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </ResizableTable>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huỷ đặt nếu không sử dụng sau (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.no_show_minutes}
                  onChange={(e) => setFormData({ ...formData, no_show_minutes: parseInt(e.target.value) })}
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nếu đến giờ mà chưa dùng, sau thời gian này booking sẽ bị huỷ tự động
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('admin.importExport.importModal.title')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.importExport.importModal.selectFile')}
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.importExport.importModal.fileFormat')}
                </p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                <strong>Lưu ý:</strong> {t('admin.importExport.importModal.note')}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('admin.importExport.importModal.cancel')}
                </button>
                <button 
                  onClick={handleImportGroups}
                  className="btn btn-primary flex-1"
                  disabled={!importFile}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('admin.importExport.importModal.import')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


