import { useEffect, useState } from 'react'
import axios from 'axios'
import { Save } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminFooterSettings() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ supportEmail: '', phone: '', teamsLink: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/admin/settings/footer')
        setForm(res.data || { supportEmail: '', phone: '', teamsLink: '' })
      } catch (e) {}
    }
    load()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await axios.post('/api/admin/settings/footer', form)
      setMessage({ type: 'success', text: t('admin.footer.saved') || 'Đã lưu footer' })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || (t('admin.ui.saveFailed') || 'Lưu thất bại') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.footer.title') || 'Footer Settings'}</h1>
        <button disabled={saving} onClick={onSave} className="btn btn-primary inline-flex items-center">
          <Save className="h-4 w-4 mr-2" /> {saving ? (t('common.loading') || 'Đang lưu...') : (t('common.save') || 'Lưu')}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.footer.supportEmail') || 'Support email'}</label>
          <input className="input" type="email" value={form.supportEmail} onChange={e => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.footer.phone') || 'Phone'}</label>
          <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(+84) 123 456 789" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.footer.teamsLink') || 'Microsoft Teams link'}</label>
          <input className="input" value={form.teamsLink} onChange={e => setForm({ ...form, teamsLink: e.target.value })} placeholder="https://teams.microsoft.com/..." />
        </div>
      </div>
    </div>
  )
}


