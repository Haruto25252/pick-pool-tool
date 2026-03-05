'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
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

  const getEmail = (name: string) => `${name.trim().toLowerCase().replace(/\s+/g, '_')}@pickpooltool.app`

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: getEmail(accountName),
      password
    })
    if (error) { setError('アカウント名またはパスワードが違います'); setLoading(false); return }
    router.push('/')
    setLoading(false)
  }

  const handleRegister = async () => {
    setError(''); setLoading(true)
    if (accountName.trim().length < 3) { setError('アカウント名は3文字以上にしてください'); setLoading(false); return }
    if (password.length < 6) { setError('パスワードは6文字以上にしてください'); setLoading(false); return }
    const { error } = await supabase.auth.signUp({
      email: getEmail(accountName),
      password
    })
    if (error) {
      if (error.message.includes('already')) {
        setError('このアカウント名は既に使われています')
      } else {
        setError('登録に失敗しました: ' + error.message)
      }
      setLoading(false)
      return
    }
    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Pick Pool Tool</h1>
        <p className="text-sm text-gray-400 text-center mb-6">LoLのピックプール管理ツール</p>

        {/* Googleログイン */}
        <button onClick={handleGoogleLogin}
          className="w-full p-3 bg-white text-gray-900 font-bold rounded hover:bg-gray-100 flex items-center justify-center gap-3 mb-4">
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
          Googleでログイン
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-gray-600" />
          <span className="text-gray-500 text-sm">または</span>
          <div className="flex-1 border-t border-gray-600" />
        </div>

        {/* モード切り替え */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded font-bold text-sm ${mode === 'login' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            ログイン
          </button>
          <button onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded font-bold text-sm ${mode === 'register' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            新規登録
          </button>
        </div>

        <input type="text" placeholder="アカウント名"
          value={accountName} onChange={e => setAccountName(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none" />
        <input type="password" placeholder="パスワード（6文字以上）"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
          className="w-full p-3 mb-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-yellow-400 focus:outline-none" />

        {mode === 'register' && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-xs text-gray-400">
            ⚠️ <span className="text-yellow-400 font-bold">アカウント名</span>はログイン用です。<br />
            他のユーザーに公開される<span className="text-yellow-400 font-bold">ユーザー名</span>はログイン後に別途設定できます。
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
          className="w-full p-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:opacity-50">
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録'}
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