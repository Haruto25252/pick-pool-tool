'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GuestPage() {
  const [userList, setUserList] = useState<{id: string, username: string}[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profile').select('id, username').order('username')
      if (data) setUserList(data)
    }
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-yellow-400 mb-2 text-center">Pick Pool Tool</h1>
        <p className="text-gray-400 text-sm text-center mb-6">閲覧したいユーザーを選択してください</p>
        <div className="grid gap-2 mb-4">
          {userList.length === 0 && <p className="text-gray-500 text-center py-4">ユーザーがいません</p>}
          {userList.map(u => (
            <button key={u.id} onClick={() => router.push(`/user/${u.username}`)}
              className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-3 rounded transition-all border border-gray-700">
              <span className="font-bold text-white">{u.username}</span>
              <span className="text-gray-400 text-sm">閲覧 →</span>
            </button>
          ))}
        </div>
        <button onClick={() => router.push('/login')}
          className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 text-sm text-gray-400">
          ← ログインページへ戻る
        </button>
      </div>
    </div>
  )
}