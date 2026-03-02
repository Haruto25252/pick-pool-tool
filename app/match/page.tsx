'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type MatchSession = {
  id: string
  name: string
  created_by: string
  created_at: string
}

export default function MatchPage() {
  const [matches, setMatches] = useState<MatchSession[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMatchName, setNewMatchName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      fetchMatches()
    }
    init()
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase.from('match_session').select('*').order('created_at', { ascending: false })
    if (data) setMatches(data)
  }

  const addMatch = async () => {
    if (!newMatchName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('match_session').insert({
      name: newMatchName.trim(),
      created_by: user!.id
    }).select().single()
    if (data) {
      setShowAddModal(false)
      setNewMatchName('')
      router.push(`/match/${data.id}`)
    }
  }

  const deleteMatch = async (id: string) => {
    if (!confirm('この試合を削除しますか？')) return
    await supabase.from('match_session').delete().eq('id', id)
    fetchMatches()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-400">⚔️ 試合一覧</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">
              + 試合を追加
            </button>
            <button onClick={() => router.push('/')}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
              ← 戻る
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {matches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">⚔️</p>
              <p>試合がありません。追加してみましょう！</p>
            </div>
          )}
          {matches.map(match => (
            <div key={match.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700">
              <div>
                <p className="font-bold text-white text-lg">{match.name}</p>
                <p className="text-xs text-gray-400">{new Date(match.created_at).toLocaleString('ja-JP')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/match/${match.id}`)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded font-bold text-sm">
                  参加 →
                </button>
                {userId === match.created_by && (
                  <button onClick={() => deleteMatch(match.id)}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-sm">
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">試合を追加</h2>
            <input type="text" placeholder="試合名（例：5/31 カスタム）" value={newMatchName}
              onChange={e => setNewMatchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMatch()}
              className="w-full p-2 mb-4 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
            <div className="flex gap-3">
              <button onClick={addMatch} className="flex-1 p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">作成</button>
              <button onClick={() => { setShowAddModal(false); setNewMatchName('') }}
                className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}