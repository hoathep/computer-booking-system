import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Monitor, ArrowLeft, Lock } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError(t('auth.invalidResetToken'))
    }
  }, [token, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(t('auth.passwordResetSuccess'))
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        if (data.error === 'Invalid or expired password reset link') {
          setError(t('auth.invalidExpiredResetLink'))
        } else if (data.error === 'Token and new password are required') {
          setError(t('auth.tokenPasswordRequired'))
        } else if (data.error === 'New password must be at least 6 characters') {
          setError(t('auth.newPasswordMinLength'))
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

  if (!token) {
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
            <div className="text-center">
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {t('auth.invalidResetToken')}
              </div>
              <Link 
                to="/login" 
                className="btn btn-primary"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h3 className="text-2xl font-bold text-gray-900">{t('auth.resetPasswordTitle')}</h3>
            <p className="mt-2 text-gray-600">Nhập mật khẩu mới của bạn</p>
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
                {t('auth.newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder={t('auth.newPassword')}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.confirmNewPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder={t('auth.confirmNewPassword')}
                required
                minLength={6}
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
                  <Lock className="h-5 w-5 mr-2" />
                  {t('auth.resetPassword')}
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
