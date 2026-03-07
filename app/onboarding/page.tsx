'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [username, setUsername] = useState('')
  const [riotId, setRiotId] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [doNotShow, setDoNotShow] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // スキップフラグが設定済みの場合はホームへ
      if (typeof window !== 'undefined' && localStorage.getItem('skip_onboarding') === 'true') {
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
        setUsernameError('このユーザー名は既に使われています')
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
    if (doNotShow && typeof window !== 'undefined') {
      localStorage.setItem('skip_onboarding', 'true')
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Pick Pool Tool へようこそ！</h1>
        <p className="text-gray-400 text-sm text-center mb-8">プロフィールを設定しましょう。後からでも変更できます。</p>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-300 mb-1">
            ユーザー名 <span className="text-gray-500 font-normal">（任意）</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">他のユーザーがあなたのピックプールを閲覧できるURLになります</p>
          <input type="text" placeholder="例: はるん" value={username}
            onChange={e => { setUsername(e.target.value); setUsernameError('') }}
            className="w-full p-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
          {usernameError && <p className="text-red-400 text-sm mt-1">{usernameError}</p>}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-300 mb-1">
            Riot ID <span className="text-gray-500 font-normal">（任意）</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">OP.GGへのリンクに使用されます</p>
          <input type="text" placeholder="例: はるん#JP1" value={riotId}
            onChange={e => setRiotId(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
        </div>

        <button onClick={save} disabled={loading}
          className="w-full p-3 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300 disabled:opacity-50">
          {loading ? '保存中...' : '始める →'}
        </button>

        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={doNotShow}
            onChange={e => setDoNotShow(e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
          />
          <span className="text-sm text-gray-400">今後このメッセージを表示しない</span>
        </label>

        <button onClick={handleSkip}
          className="w-full p-3 mt-2 bg-gray-700 text-gray-400 rounded hover:bg-gray-600 text-sm">
          閉じる（スキップ）
        </button>
      </div>
    </div>
  )
}
