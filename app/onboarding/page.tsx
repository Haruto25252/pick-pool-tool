'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [riotId, setRiotId] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [doNotShow, setDoNotShow] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      // スキップフラグが設定済みの場合はホームへ（ユーザーIDごとに管理）
      if (typeof window !== 'undefined' && localStorage.getItem(`skip_onboarding_${user.id}`) === 'true') {
        router.push('/')
        return
      }
      // 既にユーザー名またはRiot IDが設定済みの場合はスキップ
      const { data: profile } = await supabase.from('profile').select('username, riot_id').eq('id', user.id).single()
      if (profile?.username || profile?.riot_id) router.push('/')
    }
    check()
  }, [])

  const save = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (username.trim()) {
      const { error } = await supabase.from('profile').upsert({
        id: user.id,
        username: username.trim(),
        riot_id: riotId.trim() || null
      }, { onConflict: 'id' })
      if (error) {
        setUsernameError(t('onboarding.error.taken'))
        setLoading(false)
        return
      }
    } else if (riotId.trim()) {
      await supabase.from('profile').upsert({
        id: user.id,
        riot_id: riotId.trim()
      }, { onConflict: 'id' })
    }

    router.push('/')
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      if (doNotShow && userId) {
        localStorage.setItem(`skip_onboarding_${userId}`, 'true')
      }
      // セッション中は再表示しない
      sessionStorage.setItem('onboarding_skipped', 'true')
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">{t('onboarding.title')}</h1>
        <p className="text-gray-400 text-sm text-center mb-8">{t('onboarding.subtitle')}</p>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-300 mb-1">
            {t('onboarding.username.label')} <span className="text-gray-500 font-normal">{t('onboarding.optional')}</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">{t('onboarding.username.desc')}</p>
          <input type="text" placeholder={t('onboarding.username.placeholder')} value={username}
            onChange={e => { setUsername(e.target.value); setUsernameError('') }}
            className="w-full p-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
          {usernameError && <p className="text-red-400 text-sm mt-1">{usernameError}</p>}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-300 mb-1">
            {t('onboarding.riotid.label')} <span className="text-gray-500 font-normal">{t('onboarding.optional')}</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">{t('onboarding.riotid.desc')}</p>
          <input type="text" placeholder={t('onboarding.riotid.placeholder')} value={riotId}
            onChange={e => setRiotId(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
        </div>

        <button onClick={save} disabled={loading}
          className="w-full p-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:opacity-50">
          {loading ? t('onboarding.saving') : t('onboarding.save')}
        </button>

        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={doNotShow}
            onChange={e => setDoNotShow(e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <span className="text-sm text-gray-400">{t('onboarding.skip.doNotShow')}</span>
        </label>

        <button onClick={handleSkip}
          className="w-full p-3 mt-2 bg-gray-700 text-gray-400 rounded hover:bg-gray-600 text-sm">
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  )
}
