'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const confirm = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/onboarding'), 2000)
        }
      } else {
        // Googleログイン後はURLのhashからセッションを取得
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus('success')
          setTimeout(() => router.push('/onboarding'), 2000)
        } else {
          // 少し待ってから再確認
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
        <p className="text-gray-400 text-lg">確認中...</p>
      )}
      {status === 'success' && (
        <>
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-2xl font-bold text-green-400 mb-2">ログイン完了！</h1>
          <p className="text-gray-400">2秒後にアプリに移動します...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-4xl mb-4">❌</p>
          <h1 className="text-2xl font-bold text-red-400 mb-2">認証に失敗しました</h1>
          <p className="text-gray-400 mb-4">もう一度お試しください。</p>
          <button onClick={() => router.push('/login')}
            className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">
            ログインページへ
          </button>
        </>
      )}
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
        <ConfirmContent />
      </Suspense>
    </div>
  )
}