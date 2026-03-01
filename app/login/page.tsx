'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('確認メールを送りました！メールを確認してください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
          Pick Pool Tool
        </h1>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleAuth}
          className="w-full p-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300"
        >
          {isSignUp ? '新規登録' : 'ログイン'}
        </button>
        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-center text-gray-400 mt-4 cursor-pointer hover:text-white"
        >
          {isSignUp ? 'ログインはこちら' : '新規登録はこちら'}
        </p>
        {message && <p className="text-center text-red-400 mt-4">{message}</p>}
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