'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Pick Pool Tool</h1>
        <p className="text-sm text-gray-400 text-center mb-8">LoLのピックプール管理ツール</p>
        <button onClick={handleGoogleLogin}
          className="w-full p-3 bg-white text-gray-900 font-bold rounded hover:bg-gray-100 flex items-center justify-center gap-3">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Googleでログイン
        </button>
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm mb-2">登録なしで閲覧だけしたい場合</p>
          <button onClick={() => router.push('/guest')}
            className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded font-bold text-gray-300">
            👁 ゲストとして参加
          </button>
        </div>
      </div>
    </div>
  )
}