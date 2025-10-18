import { Outlet, NavLink } from 'react-router-dom'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'
import { Monitor, Calendar, Home, LogOut, Settings, KeyRound, X } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const { t } = useTranslation()
  const [showPwd, setShowPwd] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  const navItems = [
    { to: '/dashboard', icon: Home, label: t('navigation.home') },
    { to: '/computers', icon: Monitor, label: t('navigation.bookComputer') },
    { to: '/my-bookings', icon: Calendar, label: t('navigation.myBookings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary-700 to-primary-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Monitor className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white hidden sm:block">{t('navigation.appTitle') || 'Computer Booking'}</span>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex md:space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 nav-item btn-hover-lift ${
                      isActive
                        ? 'bg-primary-800 text-white shadow-lg'
                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
              <LanguageSwitcher variant="admin" />
              
              {/* User Info - Hidden on small screens */}
              <div className="hidden lg:flex lg:items-center lg:space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white truncate max-w-32">{user?.fullname}</div>
                  <div className="text-xs text-primary-100">{user?.username}</div>
                </div>
                
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="btn btn-secondary flex items-center text-xs px-3 py-1.5"
                  >
                    <Settings className="h-4 w-4 mr-1.5" />
                    <span className="hidden xl:inline">{t('navigation.admin')}</span>
                  </NavLink>
                )}
                
                {/* Change password button */}
                <div className="relative">
                  <button
                    onClick={() => { setShowPwd(v => !v); setPwdMsg(null) }}
                    className="btn btn-secondary flex items-center text-xs px-3 py-1.5"
                  >
                    <KeyRound className="h-4 w-4 mr-1.5" />
                    <span className="hidden xl:inline">{t('auth.changePassword')}</span>
                  </button>
                  {showPwd && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-3 z-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 text-sm">{t('auth.changePassword')}</div>
                        <button onClick={() => setShowPwd(false)} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('auth.currentPassword')}</label>
                          <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="input h-8" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">{t('auth.newPassword')}</label>
                          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="input h-8" />
                        </div>
                        {pwdMsg && (
                          <div className={`text-xs ${pwdMsg.type==='success'?'text-green-700':'text-red-700'}`}>{pwdMsg.text}</div>
                        )}
                        <button
                          onClick={async () => {
                            if (!newPassword || newPassword.length < 6) { setPwdMsg({ type: 'error', text: t('auth.passwordTooShort') }); return }
                            setPwdLoading(true)
                            try {
                              await axios.post('/api/auth/change-password', { currentPassword, newPassword })
                              setPwdMsg({ type: 'success', text: t('auth.passwordChangeSuccess') })
                              setCurrentPassword(''); setNewPassword('')
                            } catch (e) {
                              setPwdMsg({ type: 'error', text: e.response?.data?.error || t('auth.passwordChangeFailed') })
                            } finally {
                              setPwdLoading(false)
                            }
                          }}
                          disabled={pwdLoading}
                          className="btn btn-primary w-full h-8 text-xs"
                        >
                          {pwdLoading ? '...' : t('common.save')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="btn btn-secondary flex items-center text-xs px-3 py-1.5"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span className="hidden xl:inline">{t('common.logout')}</span>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => {/* Mobile menu logic */}}
                  className="p-2 rounded-lg text-primary-100 hover:bg-primary-600 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}


