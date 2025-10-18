import { Outlet, NavLink, Link } from 'react-router-dom'
import Footer from './Footer'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, Monitor, Calendar, Users2, ArrowLeft, LogOut, Languages, BarChart, Settings } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'
import AdminAIAssistant from './AdminAIAssistant'
import Logo from './Logo'

export default function AdminLayout() {
  const { logout } = useAuth()
  const { t } = useTranslation()

  const manageMenu = [
    { to: '/admin/bookings', icon: Calendar, label: t('admin.bookings') },
  ]

  const reportMenu = [
    { to: '/admin/reports', icon: BarChart, label: t('admin.reportsSummary') || t('admin.reports') },
  ]

  const systemSettingMenu = [
    { to: '/admin/users', icon: Users, label: t('admin.users') },
    { to: '/admin/groups', icon: Users2, label: t('admin.groups') },
    { to: '/admin/computers', icon: Monitor, label: t('admin.computers') },
    { to: '/admin/email-server', icon: Settings, label: t('admin.emailServer.title') || 'Email Server' },
    { to: '/admin/translations', icon: Languages, label: t('admin.translations') },
    { to: '/admin/footer', icon: Settings, label: t('admin.footer.title') || 'Footer' },
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
              <NavLink to="/admin/dashboard" className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary-800 text-white shadow-lg' : 'text-primary-100 hover:bg-primary-600 hover:text-white'}`}>
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                <span className="hidden lg:inline">{t('admin.dashboard')}</span>
              </NavLink>

              {/* Manage Booking */}
              <div className="relative group">
                <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-primary-100 group-hover:bg-primary-600 group-hover:text-white cursor-default">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span className="hidden lg:inline">{t('admin.menu.manageBooking') || 'Manage Booking'}</span>
                </div>
                <div className="absolute top-full left-0 hidden group-hover:block bg-white rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                  {manageMenu.map(item => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                      <item.icon className="h-4 w-4 mr-2" /> {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Report */}
              <div className="relative group">
                <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-primary-100 group-hover:bg-primary-600 group-hover:text-white cursor-default">
                  <BarChart className="h-4 w-4 mr-1.5" />
                  <span className="hidden lg:inline">{t('admin.menu.report') || 'Report'}</span>
                </div>
                <div className="absolute top-full left-0 hidden group-hover:block bg-white rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                  {reportMenu.map(item => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                      <item.icon className="h-4 w-4 mr-2" /> {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* System Setting */}
              <div className="relative group">
                <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-primary-100 group-hover:bg-primary-600 group-hover:text-white cursor-default">
                  <Settings className="h-4 w-4 mr-1.5" />
                  <span className="hidden lg:inline">{t('admin.menu.systemSetting') || 'System Setting'}</span>
                </div>
                <div className="absolute top-full left-0 hidden group-hover:block bg-white rounded-lg shadow-lg py-1 min-w-[240px] z-50">
                  {systemSettingMenu.map(item => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                      <item.icon className="h-4 w-4 mr-2" /> {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
              <LanguageSwitcher variant="admin" />
              
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
      <Footer />
      
      {/* Admin AI Assistant */}
      <AdminAIAssistant />
    </div>
  )
}


