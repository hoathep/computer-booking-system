import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, ArrowLeft, Mail } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(t('auth.resetLinkSent'))
      } else {
        if (data.error === 'Failed to send reset email. Please try again later.') {
          setError(t('auth.failedToSendResetEmail'))
        } else if (data.error === 'Email not found in the system') {
          setError(t('auth.emailNotFound'))
        } else if (data.error === 'Email is required') {
          setError(t('auth.emailRequired'))
        } else {
          setError(data.error || t('errors.unknownError'))
        }
      }
    } catch (err) {
      setError(t('errors.networkError'))
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
          <h2 className="text-3xl font-bold text-white">Computer Booking System</h2>
          <p className="mt-2 text-primary-100">{t('auth.systemTitle')}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('auth.backToLogin')}
            </Link>
            <h3 className="text-2xl font-bold text-gray-900">{t('auth.forgotPasswordTitle')}</h3>
            <p className="mt-2 text-gray-600">{t('auth.forgotPasswordSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={t('auth.email')}
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
                  <Mail className="h-5 w-5 mr-2" />
                  {t('auth.sendResetLink')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('common.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
