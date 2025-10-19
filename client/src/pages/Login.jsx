import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Monitor, LogIn } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(username, password)
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error
      
      // Handle network errors
      if (!err.response) {
        setError(t('errors.networkError'))
      } else if (errorMessage === 'Invalid credentials') {
        setError(t('auth.invalidCredentials'))
      } else if (errorMessage === 'Username and password required') {
        setError(t('auth.usernamePasswordRequired'))
      } else if (errorMessage === 'Account is banned') {
        setError(t('auth.accountBanned'))
      } else if (errorMessage === 'Failed to send reset email. Please try again later.') {
        setError(t('auth.failedToSendResetEmail'))
      } else if (errorMessage === 'Current password is incorrect') {
        setError(t('auth.currentPasswordIncorrect'))
      } else if (errorMessage === 'Email not found in the system') {
        setError(t('auth.emailNotFound'))
      } else if (errorMessage === 'Email is required') {
        setError(t('auth.emailRequired'))
      } else if (errorMessage === 'Invalid or expired password reset link') {
        setError(t('auth.invalidExpiredResetLink'))
      } else {
        setError(errorMessage || t('auth.loginError'))
      }
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
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.loginTitle')}</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder={t('auth.username')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder={t('auth.password')}
                required
              />
            </div>

            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t('auth.forgotPassword')}
              </Link>
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
                  <LogIn className="h-5 w-5 mr-2" />
                  {t('auth.loginButton')}
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}


