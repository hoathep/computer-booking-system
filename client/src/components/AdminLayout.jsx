import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, Monitor, Calendar, Users2, ArrowLeft, LogOut, Languages, BarChart } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'

export default function AdminLayout() {
  const { logout } = useAuth()
  const { t } = useTranslation()

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { to: '/admin/users', icon: Users, label: t('admin.users') },
    { to: '/admin/computers', icon: Monitor, label: t('admin.computers') },
    { to: '/admin/bookings', icon: Calendar, label: t('admin.bookings') },
    { to: '/admin/reports', icon: BarChart, label: t('admin.reports') },
    { to: '/admin/groups', icon: Users2, label: t('admin.groups') },
    { to: '/admin/translations', icon: Languages, label: t('admin.translations') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary-700 to-primary-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Monitor className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white hidden sm:block">{t('admin.panel')}</span>
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
              <LanguageSwitcher />
              
              {/* Action Buttons */}
              <div className="hidden lg:flex lg:items-center lg:space-x-3">
                <Link 
                  to="/dashboard" 
                  className="text-white hover:text-primary-100 flex items-center px-3 py-2 rounded-lg hover:bg-primary-600 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  <span className="hidden xl:inline">{t('common.back')}</span>
                </Link>
                
                <button
                  onClick={logout}
                  className="text-white hover:text-primary-100 flex items-center px-3 py-2 rounded-lg hover:bg-primary-600 transition-all duration-200"
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
    </div>
  )
}


