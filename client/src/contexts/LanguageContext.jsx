import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext()

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'vi')

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ]

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode)
    setCurrentLanguage(languageCode)
    localStorage.setItem('language', languageCode)
  }

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && languages.find(lang => lang.code === savedLanguage)) {
      changeLanguage(savedLanguage)
    }
  }, [])

  const value = {
    currentLanguage,
    languages,
    changeLanguage,
    t: i18n.t
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
