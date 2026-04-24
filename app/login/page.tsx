'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import AdBanner from '@/components/AdBanner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { lang, t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [accountName, setAccountName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/confirm` }
    })
  }

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/confirm` }
    })
  }

  const getEmail = (name: string) => `${name.trim().toLowerCase().replace(/\s+/g, '_')}@pickpooltool.app`

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: getEmail(accountName),
      password
    })
    if (error) { setError(t('login.error.wrong')); setLoading(false); return }
    router.push('/')
    setLoading(false)
  }

  const handleRegister = async () => {
    setError(''); setLoading(true)
    if (accountName.trim().length < 3) { setError(t('login.error.shortName')); setLoading(false); return }

    if (password.length < 6) { setError(t('login.error.shortPass')); setLoading(false); return }
    const { error } = await supabase.auth.signUp({
      email: getEmail(accountName),
      password
    })
    if (error) {
      if (error.message.includes('already')) {
        setError(t('login.error.taken'))
      } else {
        setError(t('login.error.failed') + error.message)
      }
      setLoading(false)
      return
    }
    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="hidden lg:flex items-center justify-center w-[300px] mr-8 flex-shrink-0">
        <AdBanner
          adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOGIN || ''}
          adFormat="auto"
          style={{ width: '300px', minHeight: '250px' }}
        />
      </div>
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Pick Pool Tool</h1>
        <p className="text-sm text-gray-400 text-center mb-6">{t('login.subtitle')}</p>

        {/* Googleログイン */}
        <button onClick={handleGoogleLogin}
          className="w-full p-3 bg-white text-gray-900 font-bold rounded hover:bg-gray-100 flex items-center justify-center gap-3 mb-4">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          {t('login.google')}
        </button>

        <button onClick={handleDiscordLogin}
          className="w-full p-3 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-500 flex items-center justify-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          {t('login.discord')}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-600" />
          <span className="text-gray-500 text-sm">{t('login.or')}</span>
          <div className="flex-1 border-t border-gray-600" />
        </div>

        {/* モード切り替え */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded font-bold text-sm ${mode === 'login' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {t('login.tab')}
          </button>
          <button onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded font-bold text-sm ${mode === 'register' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {t('login.register')}
          </button>
        </div>

        <input type="text" placeholder={t('login.accountName')}
          value={accountName} onChange={e => setAccountName(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none" />
        <p className="text-xs text-gray-500 mb-3">{t('login.accountName.note')}</p>
        <input type="password" placeholder={t('login.password')}
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
          className="w-full p-3 mb-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none" />

        {mode === 'register' && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
            ⚠️ <span className="text-yellow-400 font-bold">{t('login.register.note.account')}</span>
            {lang === 'ja' ? 'はログイン用です。' : ' is for login only.'}<br />
            {lang === 'ja' ? '他のユーザーに公開される' : 'The publicly visible '}
            <span className="text-yellow-400 font-bold">{t('login.register.note.username')}</span>
            {lang === 'ja' ? 'はログイン後に別途設定できます。' : ' can be set after login.'}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full p-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:opacity-50">
          {loading ? t('login.loading') : mode === 'login' ? t('login.submit.login') : t('login.submit.register')}
        </button>

        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm mb-2">{t('login.guest.desc')}</p>
          <button onClick={() => router.push('/guest')}
            className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded font-bold text-gray-300">
            {t('login.guest.btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
