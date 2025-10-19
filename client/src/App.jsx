import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Computers from './pages/Computers'
import TestComputers from './pages/TestComputers'
import MyBookings from './pages/MyBookings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminComputers from './pages/admin/AdminComputers'
import AdminBookings from './pages/admin/AdminBookings'
import AdminGroups from './pages/admin/AdminGroups'
import AdminTranslations from './pages/admin/AdminTranslations'
import AdminReports from './pages/admin/AdminReports'
import AdminEmailServer from './pages/admin/AdminEmailServer'
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates'
import AdminFooterSettings from './pages/admin/AdminFooterSettings'
import AdminAISettings from './pages/admin/AdminAISettings'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import './i18n'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="computers" element={<Computers />} />
              <Route path="test-computers" element={<TestComputers />} />
              <Route path="my-bookings" element={<MyBookings />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="computers" element={<AdminComputers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="translations" element={<AdminTranslations />} />
              <Route path="email-server" element={<AdminEmailServer />} />
              <Route path="email-templates" element={<AdminEmailTemplates />} />
              <Route path="ai-settings" element={<AdminAISettings />} />
              <Route path="footer" element={<AdminFooterSettings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App


