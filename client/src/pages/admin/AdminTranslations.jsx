import { useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { Languages, Plus, Edit2, Trash2, Save, X, Globe } from 'lucide-react'

export default function AdminTranslations() {
  const { t } = useTranslation()
  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState(null)
  const [formData, setFormData] = useState({
    key: '',
    language: 'vi',
    value: ''
  })
  const [message, setMessage] = useState(null)
  const [filter, setFilter] = useState('all')

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' }
  ]

  useEffect(() => {
    fetchTranslations()
  }, [])

  const fetchTranslations = async () => {
    try {
      // Mock data for now - in real app, this would be an API call
      const mockTranslations = [
        { id: 1, key: 'common.login', language: 'vi', value: 'Đăng nhập' },
        { id: 2, key: 'common.login', language: 'en', value: 'Login' },
        { id: 3, key: 'common.login', language: 'ja', value: 'ログイン' },
        { id: 4, key: 'common.register', language: 'vi', value: 'Đăng ký' },
        { id: 5, key: 'common.register', language: 'en', value: 'Register' },
        { id: 6, key: 'common.register', language: 'ja', value: '登録' },
        { id: 7, key: 'dashboard.title', language: 'vi', value: 'Trang chủ' },
        { id: 8, key: 'dashboard.title', language: 'en', value: 'Home' },
        { id: 9, key: 'dashboard.title', language: 'ja', value: 'ホーム' },
      ]
      setTranslations(mockTranslations)
    } catch (error) {
      console.error('Failed to fetch translations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (translation = null) => {
    if (translation) {
      setEditingTranslation(translation)
      setFormData({
        key: translation.key,
        language: translation.language,
        value: translation.value
      })
    } else {
      setEditingTranslation(null)
      setFormData({
        key: '',
        language: 'vi',
        value: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      if (editingTranslation) {
        // Update translation
        setTranslations(prev => prev.map(t => 
          t.id === editingTranslation.id 
            ? { ...t, ...formData }
            : t
        ))
        setMessage({ type: 'success', text: 'Cập nhật bản dịch thành công!' })
      } else {
        // Add new translation
        const newTranslation = {
          id: Date.now(),
          ...formData
        }
        setTranslations(prev => [...prev, newTranslation])
        setMessage({ type: 'success', text: 'Thêm bản dịch thành công!' })
      }
      setShowModal(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra!' })
    }
  }

  const handleDelete = async (translationId) => {
    if (!confirm('Bạn có chắc muốn xóa bản dịch này?')) return

    try {
      setTranslations(prev => prev.filter(t => t.id !== translationId))
      setMessage({ type: 'success', text: 'Xóa bản dịch thành công!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Xóa bản dịch thất bại!' })
    }
  }

  const filteredTranslations = filter === 'all' 
    ? translations 
    : translations.filter(t => t.language === filter)

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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.translations')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.translationManagement')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          {t('admin.addTranslation')}
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

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by language:</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input py-2"
        >
          <option value="all">All Languages</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.translationKey')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.language')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.translationValue')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTranslations.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{translation.key}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      translation.language === 'vi' ? 'bg-green-100 text-green-700' :
                      translation.language === 'en' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {languages.find(l => l.code === translation.language)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 max-w-md truncate">{translation.value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleOpenModal(translation)}
                      className="text-primary-600 hover:text-primary-700 mr-3"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(translation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTranslations.length === 0 && (
            <div className="text-center py-12">
              <Languages className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No translations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTranslation ? t('admin.editTranslation') : t('admin.addTranslation')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.translationKey')}
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="input"
                  placeholder="e.g., common.login"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.language')}
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="input"
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.translationValue')}
                </label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Enter translation value"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
