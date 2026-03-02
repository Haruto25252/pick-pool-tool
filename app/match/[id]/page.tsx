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
}

type PickPool = {
  id: string
  champion_name: string
  lane: string[]
  priority: number
  note: string
}

type Matchup = {
  champion_name: string
  favorable: string[]
  unfavorable: string[]
}

type ChampionConfig = {
  champion_name: string
  lanes: string[]
  tags: string[]
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [match, setMatch] = useState<MatchSession | null>(null)
  const [myTeam, setMyTeam] = useState<'team1' | 'team2' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showChampPicker, setShowChampPicker] = useState<'ban' | 'team1' | 'team2' | null>(null)
  const [champSearch, setChampSearch] = useState('')
  const [pickPool, setPickPool] = useState<PickPool[]>([])
  const [matchups, setMatchups] = useState<Record<string, Matchup>>({})
  const [championConfigs, setChampionConfigs] = useState<Record<string, ChampionConfig>>({})

  const allChampions = Object.keys(championMap)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // ピックプールとマッチアップ取得
        const [{ data: pool }, { data: mu }, { data: defaultMu }, { data: configs }, { data: defaultConfigs }] = await Promise.all([
          supabase.from('pick_pool').select('*').eq('user_id', user.id).order('priority', { ascending: false }),
          supabase.from('matchup').select('*').eq('user_id', user.id),
          supabase.from('default_matchup').select('*'),
          supabase.from('champion_config').select('*').eq('user_id', user.id),
          supabase.from('default_champion_config').select('*')
        ])
        if (pool) setPickPool(pool)
        if (mu) {
          const defaultMap: Record<string, Matchup> = {}
          if (defaultMu) defaultMu.forEach((m: Matchup) => { defaultMap[m.champion_name] = m })
          const map: Record<string, Matchup> = { ...defaultMap }
          mu.forEach((m: Matchup) => { map[m.champion_name] = m })
          setMatchups(map)
        }
        if (configs) {
          const defaultMap: Record<string, ChampionConfig> = {}
          if (defaultConfigs) defaultConfigs.forEach((c: ChampionConfig) => { defaultMap[c.champion_name] = c })
          const map: Record<string, ChampionConfig> = { ...defaultMap }
          configs.forEach((c: ChampionConfig) => { map[c.champion_name] = c })
          setChampionConfigs(map)
        }
      }
      fetchMatch()
    }
    init()

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
    setMatch({ ...match, bans: newBans })
    await supabase.from('match_session').update({ bans: newBans }).eq('id', id)
  }

  const togglePick = async (name: string, team: 'team1' | 'team2') => {
    if (!match) return
    const key = team === 'team1' ? 'team1_picks' : 'team2_picks'
    const current = match[key]
    const newPicks = current.includes(name)
      ? current.filter(n => n !== name)
      : [...current, name]
    setMatch({ ...match, [key]: newPicks })
    await supabase.from('match_session').update({ [key]: newPicks }).eq('id', id)
  }

  const resetMatch = async () => {
    if (!confirm('試合をリセットしますか？')) return
    const reset = { bans: [], team1_picks: [], team2_picks: [] }
    setMatch({ ...match!, ...reset })
    await supabase.from('match_session').update(reset).eq('id', id)
  }

  const getPickInfo = (name: string) => pickPool.find(p => p.champion_name === name)

  const getCounterScore = (name: string, enemyChamps: string[]): number => {
    if (enemyChamps.length === 0) return 0
    const mu = matchups[name]
    if (!mu) return 0
    let score = 0
    enemyChamps.forEach(enemy => {
      if (mu.favorable.includes(enemy)) score += 1
      if (mu.unfavorable.includes(enemy)) score -= 1
    })
    return score
  }

  const priorityBorder = (p: number) => {
    if (p >= 4) return 'border-yellow-400'
    if (p >= 2) return 'border-blue-400'
    return 'border-gray-500'
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

  // 相手チームのピックを相手チャンプとして使用
  const enemyTeam = myTeam === 'team1' ? 'team2' : 'team1'
  const enemyChamps = match[`${enemyTeam}_picks`]
  const allPicked = [...match.team1_picks, ...match.team2_picks, ...match.bans]

  // ピックプール並び替え
  const sortedPool = [...pickPool.map(p => p.champion_name)].sort((a, b) => {
    const sa = getCounterScore(a, enemyChamps)
    const sb = getCounterScore(b, enemyChamps)
    const aSkill = enemyChamps.some(e => matchups[a]?.favorable.includes(e)) &&
                   enemyChamps.some(e => matchups[a]?.unfavorable.includes(e))
    const bSkill = enemyChamps.some(e => matchups[b]?.favorable.includes(e)) &&
                   enemyChamps.some(e => matchups[b]?.unfavorable.includes(e))
    if (enemyChamps.length > 0) {
      const aGroup = sa > 0 ? 0 : aSkill ? 1 : sa === 0 ? 2 : 3
      const bGroup = sb > 0 ? 0 : bSkill ? 1 : sb === 0 ? 2 : 3
      if (aGroup !== bGroup) return aGroup - bGroup
    }
    if (sb !== sa) return sb - sa
    const pa = getPickInfo(a)?.priority ?? 0
    const pb = getPickInfo(b)?.priority ?? 0
    return pb - pa
  })

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
                <button onClick={() => setShowChampPicker(team)}
                  className={`px-2 py-1 rounded text-xs ${team === 'team1' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-red-700 hover:bg-red-600'}`}>
                  + ピック
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {match[`${team}_picks`].length === 0 && <p className="text-gray-500 text-sm">ピックなし</p>}
                {match[`${team}_picks`].map(name => (
                  <button key={name} onClick={() => togglePick(name, team)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm border
                      ${team === 'team1' ? 'bg-blue-900 border-blue-500 hover:bg-blue-800' : 'bg-red-900 border-red-500 hover:bg-red-800'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                    {name}
                    <span className="ml-1 opacity-50">×</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ピックプール */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-bold text-yellow-400 mb-3">
            🎯 あなたのピックプール
            {enemyChamps.length > 0 && <span className="text-sm text-gray-400 ml-2">（相手: {enemyChamps.join(', ')}）</span>}
          </h2>
          {sortedPool.length === 0 && <p className="text-gray-500 text-sm">ピックプールが空です</p>}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {sortedPool.map(name => {
              const pickInfo = getPickInfo(name)
              const isBanned = match.bans.includes(name)
              const isPicked = allPicked.includes(name)
              const score = getCounterScore(name, enemyChamps)
              const isSkill = enemyChamps.some(e => matchups[name]?.favorable.includes(e)) &&
                              enemyChamps.some(e => matchups[name]?.unfavorable.includes(e))
              const champTags = championConfigs[name]?.tags || []

              return (
                <div key={name}
                  className={`relative rounded-lg p-2 flex flex-col items-center gap-1 border-2 transition-all
                    ${isBanned || isPicked ? 'opacity-30 border-gray-600 bg-gray-800'
                      : isSkill ? 'bg-yellow-950 border-yellow-400'
                      : score > 0 ? 'bg-green-950 border-green-400'
                      : score < 0 ? 'bg-red-950 border-red-800'
                      : `bg-gray-800 ${priorityBorder(pickInfo?.priority ?? 0)}`}
                  `}>
                  {score !== 0 && !isBanned && !isPicked && (
                    <span className={`absolute top-1 left-1 text-xs font-bold ${score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {score > 0 ? `+${score}` : score}
                    </span>
                  )}
                  {getChampionIcon(name)
                    ? <img src={getChampionIcon(name)} alt={name} className="w-10 h-10 rounded-full" />
                    : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">{name}</div>
                  }
                  <p className="text-xs text-center font-bold leading-tight text-yellow-400">{name}</p>
                  {champTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {champTags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-purple-900 text-purple-300 px-1 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* チャンプピッカー */}
      {showChampPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              {showChampPicker === 'ban' ? '🚫 BANするチャンプを選択'
                : showChampPicker === 'team1' ? '🔵 チーム1のピックを選択'
                : '🔴 チーム2のピックを選択'}
            </h2>
            <input type="text" placeholder="検索..." value={champSearch}
              onChange={e => setChampSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-4">
              {allChampions.filter(n => champSearch === '' || n.includes(champSearch)).map(name => {
                const isAlreadyUsed = allPicked.includes(name)
                const isSelected = showChampPicker === 'ban' ? match.bans.includes(name)
                  : match[`${showChampPicker}_picks`].includes(name)
                return (
                  <button key={name} onClick={() => {
                    if (showChampPicker === 'ban') toggleBan(name)
                    else togglePick(name, showChampPicker)
                  }}
                    disabled={isAlreadyUsed && !isSelected}
                    className={`text-xs p-2 rounded flex items-center gap-1 border transition-all
                      ${isAlreadyUsed && !isSelected ? 'opacity-20 border-gray-700 bg-gray-800 cursor-not-allowed'
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