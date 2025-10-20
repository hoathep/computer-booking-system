import { useEffect, useState } from 'react'
import axios from 'axios'
import Logo from './Logo'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  const [cfg, setCfg] = useState({ supportEmail: '', phone: '', teamsLink: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/admin/settings/footer')
        setCfg(res.data || { supportEmail: '', phone: '', teamsLink: '' })
      } catch (e) {}
    }
    load()
  }, [])

  return (
    <footer className="mt-10 border-t bg-gradient-to-r from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main content - 3 column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-2">
          {/* Left column - Logo only, aligned to right */}
          <div className="flex justify-end">
            <Logo className="h-12 w-12" />
          </div>
          
          {/* Center column - Title and contact info */}
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-gray-800 mb-2">Computer Booking System</div>
            <div className="text-sm text-gray-600">
              {cfg.supportEmail && (
                <a href={`mailto:${cfg.supportEmail}`} className="text-primary-700 hover:text-primary-900">{cfg.supportEmail}</a>
              )}
              {cfg.supportEmail && (cfg.phone || cfg.teamsLink) && <span className="mx-2">•</span>}
              {cfg.phone && <span>{cfg.phone}</span>}
            </div>
          </div>
          
          {/* Right column - Teams link */}
          <div className="text-center md:text-right">
            {cfg.teamsLink && (
              <a href={cfg.teamsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900">
                <span aria-hidden>💬✨</span>
                <span>{t('admin.footer.teamsChat')}</span>
              </a>
            )}
          </div>
        </div>
        
        {/* Copyright line - shift left by 2cm */}
        <div className="text-sm text-gray-500 text-center pt-2" style={{ position: 'relative', left: '-2cm' }}>
          DENSO Viet Nam Design Center © 2025 - All rights reserved
        </div>
      </div>
    </footer>
  )
}


