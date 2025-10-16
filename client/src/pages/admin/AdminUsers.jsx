import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Edit2, Trash2, Save, X, ShieldAlert, ShieldCheck } from 'lucide-react'
import ResizableTable from '../../components/ResizableTable'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminUsers() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    role: 'user',
    group_name: 'default',
    max_concurrent_bookings: 1,
    banned: 0
  })
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/groups')
      ])
      setUsers(usersRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        password: '',
        fullname: user.fullname,
        email: user.email || '',
        role: user.role,
        group_name: user.group_name,
        max_concurrent_bookings: user.max_concurrent_bookings || 0,
        banned: user.banned || 0
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        password: '',
        fullname: '',
        email: '',
        role: 'user',
        group_name: 'default',
        max_concurrent_bookings: 1,
        banned: 0
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser.id}`, formData)
        setMessage({ type: 'success', text: 'Cập nhật user thành công!' })
      } else {
        await axios.post('/api/admin/users', formData)
        setMessage({ type: 'success', text: 'Tạo user thành công!' })
      }
      setShowModal(false)
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Có lỗi xảy ra!' })
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return

    try {
      await axios.delete(`/api/admin/users/${userId}`)
      setMessage({ type: 'success', text: 'Xóa user thành công!' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Xóa user thất bại!' })
    }
  }

  const handleBanToggle = async (user) => {
    try {
      if (user.banned) {
        await axios.post(`/api/admin/users/${user.id}/unban`)
        setMessage({ type: 'success', text: `Đã gỡ ban '${user.username}'` })
      } else {
        await axios.post(`/api/admin/users/${user.id}/ban`)
        setMessage({ type: 'success', text: `Đã ban '${user.username}'` })
      }
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Thao tác thất bại!' })
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.users')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.userManagement')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            try {
              const res = await axios.get('/api/admin/users/export', { responseType: 'blob' })
              const url = window.URL.createObjectURL(new Blob([res.data]))
              const a = document.createElement('a'); a.href = url; a.download = 'users-export.json'; a.click();
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
                await axios.post('/api/admin/users/import', json)
                fetchData()
                setMessage({ type: 'success', text: 'Import users thành công!' })
              } catch (err) {
                console.error(err)
                setMessage({ type: 'error', text: err.response?.data?.error || 'Import thất bại!' })
              } finally {
                e.target.value = ''
              }
            }} />
          </label>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">{t('admin.addUser')}</button>
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <ResizableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 text-center text-sm">
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('auth.username') || 'Username'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('auth.fullname') || 'Full name'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('common.email') || 'Email'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.role') || 'Role'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.group') || 'Group'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.limit') || 'Limit'}</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.status') || 'Status'}</th>
                <th className="px-4 py-2 text-right border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('admin.tables.actions') || t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.banned ? 'opacity-70' : ''}`}>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 border-r border-gray-100 last:border-r-0">{user.username}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700 border-r border-gray-100 last:border-r-0">{user.fullname}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600 border-r border-gray-100 last:border-r-0">{user.email || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700 border-r border-gray-100 last:border-r-0">{user.group_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700 border-r border-gray-100 last:border-r-0">{user.max_concurrent_bookings || 'Theo nhóm'}</td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                    {user.banned ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 inline-flex items-center">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> {t('admin.tables.banned') || 'Banned'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 inline-flex items-center">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {t('admin.tables.active') || 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right border-r border-gray-100 last:border-r-0">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-primary-600 hover:text-primary-700 mr-3"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const pwd = prompt('Nhập mật khẩu mới (≥ 6 ký tự):')
                        if (!pwd) return
                        if (pwd.length < 6) { setMessage({ type: 'error', text: 'Mật khẩu phải ≥ 6 ký tự' }); return }
                        try {
                          await axios.post(`/api/admin/users/${user.id}/password`, { password: pwd })
                          setMessage({ type: 'success', text: `Đã đổi mật khẩu cho '${user.username}'` })
                        } catch (e) {
                          setMessage({ type: 'error', text: e.response?.data?.error || 'Đổi mật khẩu thất bại' })
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                      title="Đổi mật khẩu"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    {user.role !== 'admin' && (
                      <>
                        <button
                          onClick={() => handleBanToggle(user)}
                          className={`mr-3 ${user.banned ? 'text-green-600 hover:text-green-700' : 'text-yellow-600 hover:text-yellow-700'}`}
                          title={user.banned ? 'Unban' : 'Ban'}
                        >
                          {user.banned ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </ResizableTable>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Sửa User' : 'Thêm User'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  disabled={!!editingUser}
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingUser}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm</label>
                <select
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  className="input"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.group_name}>{group.group_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới hạn booking (0 = theo nhóm)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_concurrent_bookings}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_bookings: parseInt(e.target.value) })}
                  className="input"
                />
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.banned}
                    onChange={(e) => setFormData({ ...formData, banned: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value={0}>Active</option>
                    <option value={1}>Banned</option>
                  </select>
                </div>
              )}

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


