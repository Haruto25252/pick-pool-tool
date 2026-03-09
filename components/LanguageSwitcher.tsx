'use client'

import { useState } from 'react'
import { useLanguage } from './LanguageContext'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        title={t('language.change')}
        className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm flex items-center gap-1"
      >
        <span>{lang === 'ja' ? '🇯🇵' : '🇬🇧'}</span>
        <span className="font-bold">{lang === 'ja' ? 'JPN' : 'ENG'}</span>
      </button>
      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg z-20 overflow-hidden shadow-xl min-w-[100px]">
            <button
              onClick={() => { setLang('ja'); setShowDropdown(false) }}
              className={`flex flex-col items-center gap-1 px-4 py-3 hover:bg-gray-700 w-full text-center transition-colors ${lang === 'ja' ? 'bg-gray-700' : ''}`}
            >
              <span className="text-2xl">🇯🇵</span>
              <span className="text-xs font-bold text-gray-200">JPN</span>
              <span className="text-xs text-gray-400">{t('language.changeToJa')}</span>
            </button>
            <div className="border-t border-gray-600" />
            <button
              onClick={() => { setLang('en'); setShowDropdown(false) }}
              className={`flex flex-col items-center gap-1 px-4 py-3 hover:bg-gray-700 w-full text-center transition-colors ${lang === 'en' ? 'bg-gray-700' : ''}`}
            >
              <span className="text-2xl">🇬🇧</span>
              <span className="text-xs font-bold text-gray-200">ENG</span>
              <span className="text-xs text-gray-400">{t('language.changeToEn')}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
