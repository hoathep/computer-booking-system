import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Footer() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="text-sm text-gray-600 text-center md:text-left whitespace-nowrap">
          Computer Booking System © Design Center DENSO Viet Nam
        </div>
        <div className="text-sm text-gray-600 text-center">
          {cfg.supportEmail && (
            <a href={`mailto:${cfg.supportEmail}`} className="text-primary-700 hover:text-primary-900">{cfg.supportEmail}</a>
          )}
          {cfg.supportEmail && (cfg.phone || cfg.teamsLink) && <span className="mx-2">•</span>}
          {cfg.phone && <span>{cfg.phone}</span>}
        </div>
        <div className="text-sm text-center md:text-right">
          {cfg.teamsLink && (
            <a href={cfg.teamsLink} target="_blank" rel="noreferrer" className="text-primary-700 hover:text-primary-900">Microsoft Teams</a>
          )}
        </div>
      </div>
    </footer>
  )
}


