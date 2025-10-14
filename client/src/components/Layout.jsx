import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Monitor, Calendar, Home, LogOut, Settings } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const { t } = useTranslation()

  const navItems = [
    { to: '/dashboard', icon: Home, label: t('navigation.home') },
    { to: '/computers', icon: Monitor, label: t('navigation.bookComputer') },
    { to: '/my-bookings', icon: Calendar, label: t('navigation.myBookings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Monitor className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">Computer Booking</span>
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
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
              <LanguageSwitcher />
              
              {/* User Info - Hidden on small screens */}
              <div className="hidden lg:flex lg:items-center lg:space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.fullname}</div>
                  <div className="text-xs text-gray-500">{user?.username}</div>
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
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
    </div>
  )
}


