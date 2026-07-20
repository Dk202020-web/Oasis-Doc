import { createContext, useContext, useEffect, useState } from 'react'

const LangContext = createContext(null)

function getStoredLang() {
  if (typeof window === 'undefined') return 'fr'
  const saved = window.localStorage.getItem('oasis_lang')
  return saved === 'en' ? 'en' : 'fr'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getStoredLang)

  function toggleLang() {
    const next = lang === 'fr' ? 'en' : 'fr'
    try {
      window.localStorage.setItem('oasis_lang', next)
    } catch {
      // ignore storage issues in restricted browser contexts
    }
    setLang(next)
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = lang === 'en'
      ? 'Oasis-Doc | Official document services'
      : 'Oasis-Doc | Services de documents officiels'
    try {
      window.localStorage.setItem('oasis_lang', lang)
    } catch {
      // ignore storage issues in restricted browser contexts
    }
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export function text(lang, fr, en) {
  return lang === 'en' ? en : fr
}

// Small helper: given a row with name_fr/name_en (or description_fr/en
// etc.), pick the right field for the active language with a fallback.
export function pick(row, field, lang) {
  if (!row) return ''
  return row[`${field}_${lang}`] || row[`${field}_fr`] || row[`${field}_en`] || ''
}
