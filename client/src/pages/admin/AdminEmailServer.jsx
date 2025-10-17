import { useEffect, useState } from 'react'
import axios from 'axios'
import { Save } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminEmailServer() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ host: '', port: 587, secure: false, authUser: '', authPass: '', fromEmail: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/admin/settings')
        if (res.data?.smtpConfig) {
          setForm(res.data.smtpConfig)
        }
      } catch (e) {}
    }
    load()
  }, [])

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await axios.post('/api/admin/settings/smtp', form)
      setMessage({ type: 'success', text: t('admin.emailServer.saved') || 'Đã lưu cấu hình SMTP' })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || (t('admin.ui.saveFailed') || 'Lưu thất bại') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.emailServer.title') || 'Email Server (SMTP)'}</h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.host') || 'SMTP Host'}</label>
          <input className="input" value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.port') || 'SMTP Port'}</label>
          <input type="number" className="input" value={form.port} onChange={e => setForm({ ...form, port: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.secure') || 'Secure (TLS/SSL)'}</label>
          <select className="input" value={form.secure ? 'true' : 'false'} onChange={e => setForm({ ...form, secure: e.target.value === 'true' })}>
            <option value="false">{t('common.no') || 'No'}</option>
            <option value="true">{t('common.yes') || 'Yes'}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.user') || 'Auth User'}</label>
          <input className="input" value={form.authUser} onChange={e => setForm({ ...form, authUser: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.pass') || 'Auth Password'}</label>
          <input type="password" className="input" value={form.authPass} onChange={e => setForm({ ...form, authPass: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.emailServer.from') || 'From Email'}</label>
          <input className="input" value={form.fromEmail} onChange={e => setForm({ ...form, fromEmail: e.target.value })} />
        </div>
      </div>
    </div>
  )
}


