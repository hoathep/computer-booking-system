import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Monitor, UserPlus } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      await register(formData.username, formData.password, formData.fullname, formData.email)
      navigate('/login', { state: { message: t('auth.registerSuccess') } })
    } catch (err) {
      setError(err.response?.data?.error || t('auth.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Monitor className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t('auth.registerTitle')}</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullname')}</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className="input"
                placeholder={t('auth.fullname')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder={t('auth.username')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder={t('auth.password')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder={t('auth.confirmPassword')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  {t('auth.registerButton')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.loginButton')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


