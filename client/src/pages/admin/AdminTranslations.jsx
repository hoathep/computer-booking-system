import { useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { Languages, Edit2, Trash2, Save, X, Globe, AlertCircle, Download, Upload } from 'lucide-react'
import ResizableTable from '../../components/ResizableTable'
import axios from 'axios'

export default function AdminTranslations() {
  const { t } = useTranslation()
  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [prefix, setPrefix] = useState('all')
  const [editingKey, setEditingKey] = useState(null)
  const [editRow, setEditRow] = useState({ key: '', en: '', vi: '', ja: '' })

  useEffect(() => {
    fetchTranslations()
  }, [])

  const fetchTranslations = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/admin/translations')
      // convert server rows to internal triplet list
      const rows = []
      for (const r of res.data.rows || []) {
        if (r.en) rows.push({ id: `${r.key}-en`, key: r.key, language: 'en', value: r.en })
        if (r.vi) rows.push({ id: `${r.key}-vi`, key: r.key, language: 'vi', value: r.vi })
        if (r.ja) rows.push({ id: `${r.key}-ja`, key: r.key, language: 'ja', value: r.ja })
      }
      setTranslations(rows)
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Không thể tải bản dịch' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteByKey = async (key) => {
    if (!confirm(`Xóa tất cả bản dịch cho key "${key}"?`)) return
    try {
      await axios.delete(`/api/admin/translations/${encodeURIComponent(key)}`)
      await fetchTranslations()
      setMessage({ type: 'success', text: 'Đã xóa tất cả bản dịch theo key' })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Xóa thất bại!' })
    }
  }

  const startEdit = (row) => {
    const en = row.en?.value || ''
    setEditingKey(row.key)
    setEditRow({
      key: row.key,
      en,
      vi: row.vi?.value || en,
      ja: row.ja?.value || en
    })
  }

  const startAdd = () => {
    setEditingKey('__new__')
    setEditRow({ key: '', en: '', vi: '', ja: '' })
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditRow({ key: '', en: '', vi: '', ja: '' })
  }

  const saveEdit = async () => {
    const isNew = editingKey === '__new__'
    const key = (editRow.key || '').trim()
    if (!key) {
      setMessage({ type: 'error', text: 'Key không được để trống' })
      return
    }
    try {
      await axios.post('/api/admin/translations', {
        key,
        en: editRow.en,
        vi: editRow.vi || editRow.en,
        ja: editRow.ja || editRow.en
      })
      await fetchTranslations()
      setMessage({ type: 'success', text: isNew ? 'Đã thêm bản dịch' : 'Đã lưu bản dịch' })
      cancelEdit()
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Lưu thất bại' })
    }
  }

  // Group translations by key into columns
  const groupedMap = translations.reduce((map, t) => {
    if (!map.has(t.key)) map.set(t.key, { key: t.key, vi: null, en: null, ja: null })
    const row = map.get(t.key)
    row[t.language] = t
    return map
  }, new Map())

  const grouped = (() => {
    const arr = Array.from(groupedMap.values())
    if (editingKey === '__new__') {
      arr.unshift({ key: '', vi: null, en: null, ja: null, __new__: true })
    }
    return arr
  })()

  const prefixOptions = Array.from(new Set(translations.map(t => t.key.split('.')[0]))).sort()
  const visibleRows = grouped.filter(r => prefix === 'all' ? true : (r.__new__ ? true : r.key.startsWith(prefix + '.')))

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/admin/translations/export')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'locales-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Export thất bại' })
    }
  }

  const handleImport = async (file) => {
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await axios.post('/api/admin/translations/import', { ...payload, mode: 'merge' })
      await fetchTranslations()
      setMessage({ type: 'success', text: 'Import thành công' })
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Import thất bại' })
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.translations')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.translationManagement')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startAdd} className="btn btn-primary">{t('admin.addTranslation')}</button>
          <button onClick={handleExport} className="btn btn-secondary inline-flex items-center"><Download className="h-4 w-4 mr-1" /> {t('admin.ui.export') || 'Export'}</button>
          <label className="btn btn-secondary inline-flex items-center cursor-pointer">
            <Upload className="h-4 w-4 mr-1" /> {t('admin.ui.import') || 'Import'}
            <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files && e.target.files[0] && handleImport(e.target.files[0])} />
          </label>
          {/* removed advance days quick setting; now managed in Bookings page */}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {message.text}
        </div>
      )}

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('admin.ui.filterByPrefix') || 'Filter by prefix:'}</span>
        </div>
        <select
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="input py-2"
        >
          <option value="all">All</option>
          {prefixOptions.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <ResizableTable>
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50 text-center text-sm">
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">Key</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">English (Default)</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">Tiếng Việt</th>
                <th className="px-4 py-2 border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">日本語</th>
                <th className="px-4 py-2 text-center border-r border-blue-100 last:border-r-0 text-blue-900 font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {Array.from(groupedMap.values()).length === 0 && editingKey !== '__new__' && (
                <tr><td className="px-4 py-2" colSpan={5}>{t('admin.ui.noData') || 'No translations'}</td></tr>
              )}
              {(() => {
                const arr = visibleRows
                return arr.map(row => {
                  const isNew = row.__new__ === true
                  const isEditing = isNew || editingKey === row.key
                  const enVal = row.en?.value || ''
                  const viVal = row.vi?.value || enVal
                  const jaVal = row.ja?.value || enVal
                  return (
                    <tr key={isNew ? '__new__' : row.key} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900 border-r border-gray-100 last:border-r-0">
                        {isNew ? (
                          <input className="input w-full" placeholder="e.g., common.login" value={editRow.key} onChange={e => setEditRow({ ...editRow, key: e.target.value })} />
                        ) : (
                          row.key
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700 max-w-md border-r border-gray-100 last:border-r-0">
                        {isEditing ? (
                          <input className="input w-full" value={isNew ? editRow.en : (editingKey ? editRow.en : enVal)} onChange={e => setEditRow({ ...editRow, en: e.target.value })} />
                        ) : (
                          <span className="truncate inline-block w-full" title={enVal}>{enVal || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700 max-w-md border-r border-gray-100 last:border-r-0">
                        {isEditing ? (
                          <input className="input w-full" value={isNew ? editRow.vi : (editingKey ? editRow.vi : viVal)} onChange={e => setEditRow({ ...editRow, vi: e.target.value })} />
                        ) : (
                          <span className="truncate inline-block w-full" title={viVal}>{viVal || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700 max-w-md border-r border-gray-100 last:border-r-0">
                        {isEditing ? (
                          <input className="input w-full" value={isNew ? editRow.ja : (editingKey ? editRow.ja : jaVal)} onChange={e => setEditRow({ ...editRow, ja: e.target.value })} />
                        ) : (
                          <span className="truncate inline-block w-full" title={jaVal}>{jaVal || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center border-r border-gray-100 last:border-r-0">
                        {isEditing ? (
                          <div className="inline-flex gap-2">
                            <button onClick={saveEdit} className="btn btn-primary inline-flex items-center"><Save className="h-4 w-4 mr-1" /> {t('common.save') || 'Lưu'}</button>
                            <button onClick={cancelEdit} className="btn btn-secondary inline-flex items-center"><X className="h-4 w-4 mr-1" /> {t('common.cancel') || 'Hủy'}</button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-2">
                            <button onClick={() => startEdit(row)} className="btn btn-secondary inline-flex items-center"><Edit2 className="h-4 w-4 mr-1" /> {t('common.edit') || 'Sửa'}</button>
                            <button onClick={() => handleDeleteByKey(row.key)} className="btn btn-danger inline-flex items-center"><Trash2 className="h-4 w-4 mr-1" /> {t('common.delete') || 'Xóa'}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              })()}
            </tbody>
          </table>
          </ResizableTable>
        </div>
      </div>
    </div>
  )
}

// Removed AdminSettingAdvanceDays component
