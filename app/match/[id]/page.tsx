'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { getChampionIcon, championMap } from '@/lib/champions'

type MatchSession = {
  id: string
  name: string
  created_by: string
  bans: string[]
  team1_picks: string[]
  team2_picks: string[]
  enemy_champs: string[]
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [match, setMatch] = useState<MatchSession | null>(null)
  const [myTeam, setMyTeam] = useState<'team1' | 'team2' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showChampPicker, setShowChampPicker] = useState<'ban' | 'pick' | null>(null)
  const [champSearch, setChampSearch] = useState('')
  const allChampions = Object.keys(championMap)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      fetchMatch()
    }
    init()

    // リアルタイム同期
    const channel = supabase.channel(`match:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_session', filter: `id=eq.${id}` },
        payload => setMatch(payload.new as MatchSession))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const fetchMatch = async () => {
    const { data } = await supabase.from('match_session').select('*').eq('id', id).single()
    if (data) setMatch(data)
  }

  const toggleBan = async (name: string) => {
    if (!match) return
    const newBans = match.bans.includes(name)
      ? match.bans.filter(n => n !== name)
      : [...match.bans, name]
    await supabase.from('match_session').update({ bans: newBans }).eq('id', id)
  }

  const togglePick = async (name: string) => {
    if (!match || !myTeam) return
    const key = myTeam === 'team1' ? 'team1_picks' : 'team2_picks'
    const current = match[key]
    const newPicks = current.includes(name)
      ? current.filter(n => n !== name)
      : [...current, name]
    await supabase.from('match_session').update({ [key]: newPicks }).eq('id', id)
  }

  const toggleEnemy = async (name: string) => {
    if (!match) return
    const newEnemy = match.enemy_champs.includes(name)
      ? match.enemy_champs.filter(n => n !== name)
      : [...match.enemy_champs, name]
    await supabase.from('match_session').update({ enemy_champs: newEnemy }).eq('id', id)
  }

  const resetMatch = async () => {
    if (!confirm('試合をリセットしますか？')) return
    await supabase.from('match_session').update({
      bans: [], team1_picks: [], team2_picks: [], enemy_champs: []
    }).eq('id', id)
  }

  if (!match) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p className="text-gray-400">読み込み中...</p>
    </div>
  )

  if (!myTeam) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-yellow-400 mb-2">{match.name}</h1>
        <p className="text-gray-400 mb-6">参加するチームを選択してください</p>
        <div className="grid gap-3">
          <button onClick={() => setMyTeam('team1')}
            className="p-4 bg-blue-700 hover:bg-blue-600 rounded-lg font-bold text-lg">
            🔵 チーム1
          </button>
          <button onClick={() => setMyTeam('team2')}
            className="p-4 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-lg">
            🔴 チーム2
          </button>
        </div>
        <button onClick={() => router.push('/match')}
          className="mt-4 w-full p-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
          ← 戻る
        </button>
      </div>
    </div>
  )

  const allPicked = [...match.team1_picks, ...match.team2_picks, ...match.bans]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-yellow-400">{match.name}</h1>
            <p className="text-sm text-gray-400">{myTeam === 'team1' ? '🔵 チーム1' : '🔴 チーム2'} として参加中</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setMyTeam(null)}
              className="px-3 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm">
              チーム変更
            </button>
            {userId === match.created_by && (
              <button onClick={resetMatch}
                className="px-3 py-2 bg-orange-700 rounded hover:bg-orange-600 text-sm font-bold">
                リセット
              </button>
            )}
            <button onClick={() => router.push('/match')}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
              ← 戻る
            </button>
          </div>
        </div>

        {/* BAN */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-red-400">🚫 BAN ({match.bans.length})</span>
            <button onClick={() => setShowChampPicker('ban')}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm">+ 追加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {match.bans.length === 0 && <p className="text-gray-500 text-sm">BANなし</p>}
            {match.bans.map(name => (
              <button key={name} onClick={() => toggleBan(name)}
                className="flex items-center gap-1 bg-red-900 border border-red-500 px-2 py-1 rounded text-sm hover:bg-red-800">
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full opacity-50" />}
                <span className="line-through text-red-300">{name}</span>
                <span className="text-red-300 ml-1">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* チーム */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {(['team1', 'team2'] as const).map(team => (
            <div key={team} className={`bg-gray-800 rounded-lg p-4 border-2 ${team === 'team1' ? 'border-blue-700' : 'border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${team === 'team1' ? 'text-blue-400' : 'text-red-400'}`}>
                  {team === 'team1' ? '🔵 チーム1' : '🔴 チーム2'} ({match[`${team}_picks`].length})
                </span>
                {myTeam === team && (
                  <button onClick={() => setShowChampPicker('pick')}
                    className={`px-2 py-1 rounded text-xs ${team === 'team1' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-red-700 hover:bg-red-600'}`}>
                    + ピック
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {match[`${team}_picks`].length === 0 && <p className="text-gray-500 text-sm">ピックなし</p>}
                {match[`${team}_picks`].map(name => (
                  <button key={name} onClick={() => myTeam === team && togglePick(name)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm border
                      ${team === 'team1' ? 'bg-blue-900 border-blue-500 hover:bg-blue-800' : 'bg-red-900 border-red-500 hover:bg-red-800'}
                      ${myTeam !== team ? 'cursor-default' : ''}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                    {name}
                    {myTeam === team && <span className="ml-1 opacity-50">×</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 相手チャンプ（ピックプール参照用） */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-orange-400">👁 ピックプール参照用（相手チャンプ）</span>
            <div className="flex gap-2">
              <button onClick={() => setShowChampPicker('enemy' as any)}
                className="px-3 py-1 bg-orange-700 hover:bg-orange-600 rounded text-sm">+ 追加</button>
              {match.enemy_champs.length > 0 && (
                <button onClick={() => supabase.from('match_session').update({ enemy_champs: [] }).eq('id', id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-400">クリア</button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {match.enemy_champs.length === 0 && <p className="text-gray-500 text-sm">選択なし</p>}
            {match.enemy_champs.map(name => (
              <button key={name} onClick={() => toggleEnemy(name)}
                className="flex items-center gap-1 bg-orange-900 border border-orange-500 px-2 py-1 rounded text-sm hover:bg-orange-800">
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                {name}<span className="text-orange-300 ml-1">×</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* チャンプピッカー */}
      {showChampPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              {showChampPicker === 'ban' ? '🚫 BANするチャンプを選択'
                : showChampPicker === 'pick' ? '✅ ピックするチャンプを選択'
                : '👁 相手チャンプを選択'}
            </h2>
            <input type="text" placeholder="検索..." value={champSearch}
              onChange={e => setChampSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-4">
              {allChampions.filter(n => champSearch === '' || n.includes(champSearch)).map(name => {
                const isPicked = allPicked.includes(name)
                const isSelected = showChampPicker === 'ban' ? match.bans.includes(name)
                  : showChampPicker === 'pick' ? match[`${myTeam}_picks`].includes(name)
                  : match.enemy_champs.includes(name)
                return (
                  <button key={name} onClick={() => {
                    if (showChampPicker === 'ban') toggleBan(name)
                    else if (showChampPicker === 'pick') togglePick(name)
                    else toggleEnemy(name)
                  }}
                    disabled={isPicked && !isSelected}
                    className={`text-xs p-2 rounded flex items-center gap-1 border transition-all
                      ${isPicked && !isSelected ? 'opacity-20 border-gray-700 bg-gray-800 cursor-not-allowed'
                        : isSelected ? 'border-yellow-400 bg-yellow-900'
                        : 'border-gray-600 bg-gray-700 hover:border-yellow-400'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                    <span className="truncate">{name}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setShowChampPicker(null); setChampSearch('') }}
              className="w-full p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">完了</button>
          </div>
        </div>
      )}
    </div>
  )
}