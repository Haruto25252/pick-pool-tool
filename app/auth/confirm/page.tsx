'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/components/LanguageContext'

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    // エラーパラメータがある場合
    const error = searchParams.get('error')
    if (error) {
      setStatus('error')
      return
    }
    const confirm = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
        if (error) {
          setStatus('error')
          }
          else {
            setStatus('success')
            setTimeout(() => router.push('/'), 2000)
          }
        } else if (code) {
          let attempts = 0
          const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              const linkFromUserId = localStorage.getItem('linkFromUserId')
              if (linkFromUserId && linkFromUserId !== session.user.id) {
                const newUserId = session.user.id
                await supabase.from('pick_pool').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
                await supabase.from('matchup').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
                await supabase.from('champion_config').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
                await supabase.from('user_tags').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
                await supabase.from('profile').update({ id: newUserId }).eq('id', linkFromUserId)
                localStorage.removeItem('linkFromUserId')
              }
              setTimeout(() => router.push('/'), 2000)
              setStatus('success')
            } else if (attempts < 5) {
              attempts++
              setTimeout(checkSession, 500)
            } else {
              setStatus('error')
            }
          }
          checkSession()
        }
      else {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // アカウント連携処理
          const linkFromUserId = localStorage.getItem('linkFromUserId')
          if (linkFromUserId && linkFromUserId !== session.user.id) {
            const newUserId = session.user.id
            await supabase.from('pick_pool').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
            await supabase.from('matchup').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
            await supabase.from('champion_config').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
            await supabase.from('user_tags').update({ user_id: newUserId }).eq('user_id', linkFromUserId)
            await supabase.from('profile').update({ id: newUserId }).eq('id', linkFromUserId)
            localStorage.removeItem('linkFromUserId')
          }
          setStatus('success')
          setTimeout(() => router.push('/'), 2000)
        } else {
          setTimeout(async () => {
            const { data: { session: session2 } } = await supabase.auth.getSession()
            if (session2) {
              setStatus('success')
              router.push('/')
            } else {
              setStatus('error')
            }
          }, 1000)
        }
      }
    }
    confirm()
  }, [])

  return (
    <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md w-full">
      {status === 'loading' && (
        <p className="text-gray-400 text-lg">{t('auth.loading')}</p>
      )}
      {status === 'success' && (
        <>
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-green-400 mb-2">{t('auth.success.title')}</h1>
          <p className="text-gray-400">{t('auth.success.desc')}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-2xl font-bold text-red-400 mb-2">{t('auth.error.title')}</h1>
          <p className="text-gray-400 mb-4">{t('auth.error.desc')}</p>
          <button onClick={() => router.push('/login')}
            className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">
            {t('auth.error.btn')}
          </button>
        </>
      )}
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <Suspense fallback={<p className="text-gray-400">{/* loading */}Loading...</p>}>
        <ConfirmContent />
      </Suspense>
    </div>
  )
}
