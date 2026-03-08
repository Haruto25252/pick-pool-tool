'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { getChampionIcon, championMap } from '@/lib/champions'
import { PRIORITY_MULTIPLIERS } from '@/lib/constants'
import { Tooltip } from '@/components/Tooltip'

const LANES = ['全て', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
const TAGS = ['ファイター', 'タンク', 'マジシャン', 'アサシン', 'マークスマン', 'サポート', 'エンゲージ', 'エンチャンター', 'メイジ', 'ダイブ', 'ピール', 'スプリット', 'スケーリング', 'アーリーゲーム']

type PickPool = {
  id: string
  champion_name: string
  lane: string[]
  priority: number
  note: string
}

type ChampionConfig = {
  champion_name: string
  lanes: string[]
  tags: string[]
}

type Matchup = {
  champion_name: string
  favorable: string[]
  unfavorable: string[]
}

export default function UserPage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [pickPool, setPickPool] = useState<PickPool[]>([])
  const [championConfigs, setChampionConfigs] = useState<Record<string, ChampionConfig>>({})
  const [matchups, setMatchups] = useState<Record<string, Matchup>>({})
  const [lane, setLane] = useState('全て')
  const [selectedTag, setSelectedTag] = useState('全て')
  const [search, setSearch] = useState('')
  const [enemyChamps, setEnemyChamps] = useState<string[]>([])
  const [bannedChamps, setBannedChamps] = useState<Set<string>>(new Set())
  const [showEnemyPicker, setShowEnemyPicker] = useState(false)
  const [enemySearch, setEnemySearch] = useState('')
  const [userTags, setUserTags] = useState<string[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [userList, setUserList] = useState<{id: string, username: string}[]>([])
  const [userListSearch, setUserListSearch] = useState('')
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null)
  const [showCounterScoreDetail, setShowCounterScoreDetail] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'pool' | 'mastery' | 'counter'>('pool')
  const [masteryData, setMasteryData] = useState<Record<string, number>>({})
  const [targetRiotId, setTargetRiotId] = useState<string | null>(null)

  const allChampions = Object.keys(championMap)

  useEffect(() => {
    const init = async () => {
      const { data: profile } = await supabase
        .from('profile')
        .select('id, riot_id')
        .eq('username', decodeURIComponent(username))
        .single()

      if (!profile) { setNotFound(true); return }
      setTargetUserId(profile.id)
      if (profile.riot_id) setTargetRiotId(profile.riot_id)

      const [{ data: pool }, { data: mu }, { data: configs }, { data: defaultMu }, { data: defaultConfigs }] = await Promise.all([
        supabase.from('pick_pool').select('*').eq('user_id', profile.id).order('priority', { ascending: false }),
        supabase.from('matchup').select('*').eq('user_id', profile.id),
        supabase.from('champion_config').select('*').eq('user_id', profile.id),
        supabase.from('default_matchup').select('*'),
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
        const tags = Array.from(new Set(Object.values(map).flatMap((c: ChampionConfig) => c.tags || [])))
        setUserTags(tags)
      }
      const { data: profiles } = await supabase.from('profile').select('id, username').order('username')
      if (profiles) setUserList(profiles)
    }
    init()
  }, [username])

  const getPickInfo = (name: string) => pickPool.find(p => p.champion_name === name)
  const getChampionTags = (name: string) => championConfigs[name]?.tags || []
  const getChampionLanes = (name: string) => {
    const poolInfo = getPickInfo(name)
    if (poolInfo) return poolInfo.lane
    return championConfigs[name]?.lanes || []
  }

  const fetchMastery = async () => {
    if (!targetRiotId) {
      alert('このユーザーはRiotIDを設定していません')
      return
    }
    const res = await fetch(`/api/mastery?riotId=${encodeURIComponent(targetRiotId)}`)
    const data = await res.json()
    if (data.error) {
      alert('マスタリー取得に失敗しました: ' + data.error)
      return
    }
    setMasteryData(data.mastery)
    setViewMode('mastery')
  }

  const getCounterScore = (name: string): number => {
    if (enemyChamps.length === 0) return 0
    const mu = matchups[name]
    if (!mu) return 0
    const pickInfo = pickPool.find(p => p.champion_name === name)
    const mult = pickInfo ? (PRIORITY_MULTIPLIERS[pickInfo.priority] ?? 1.0) : 1.0
    let score = 0
    enemyChamps.filter(e => !bannedChamps.has(e)).forEach(enemy => {
      if (mu.favorable.includes(enemy)) score += mult
      if (mu.unfavorable.includes(enemy)) score -= mult
    })
    return Math.round(score * 100) / 100
  }

  const getPoolCounterScore = (champName: string, laneFilter?: string): number => {
    let score = 0
    pickPool.forEach(p => {
      if (laneFilter && laneFilter !== '全て') {
        const pLanes = getChampionLanes(p.champion_name)
        if (pLanes.length > 0 && !pLanes.includes(laneFilter)) return
      }
      const mu = matchups[p.champion_name]
      if (!mu) return
      if (mu.unfavorable.includes(champName)) {
        score += PRIORITY_MULTIPLIERS[p.priority] ?? 1.0
      }
    })
    return score
  }

  const toggleEnemy = (name: string) => {
    setEnemyChamps(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  const toggleBan = (name: string) => {
    setBannedChamps(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const priorityBorder = (p: number) => {
    if (p >= 4) return 'border-yellow-400'
    if (p >= 2) return 'border-blue-400'
    return 'border-gray-500'
  }

  const allTags = [...TAGS, ...userTags.filter(t => !TAGS.includes(t))]

  const baseChampions = viewMode === 'mastery'
    ? Object.keys(masteryData)
    : viewMode === 'counter'
    ? allChampions
    : Array.from(new Set(pickPool.map(p => p.champion_name)))

  const filtered = baseChampions.filter(name => {
    if (viewMode === 'counter' && getPoolCounterScore(name, lane) <= 0) return false
    if (search !== '' && !name.includes(search)) return false
    const lanes = getChampionLanes(name)
    if (lane !== '全て' && lanes.length > 0 && !lanes.includes(lane)) return false
    if (selectedTag !== '全て' && !getChampionTags(name).includes(selectedTag)) return false
    return true
  })

  const sorted = Array.from(new Set([...filtered].sort((a, b) => {
    if (viewMode === 'mastery') return (masteryData[b] ?? 0) - (masteryData[a] ?? 0)
    if (viewMode === 'counter') return getPoolCounterScore(b, lane) - getPoolCounterScore(a, lane)
    return getCounterScore(b) - getCounterScore(a)
  })))

  if (notFound) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">😢</p>
        <h1 className="text-2xl font-bold text-red-400 mb-2">ユーザーが見つかりません</h1>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-yellow-400 text-gray-900 font-bold rounded">トップへ</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">{decodeURIComponent(username)} のピックプール</h1>
            <p className="text-xs text-gray-400">閲覧モード（編集不可）</p>
          </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button onClick={() => setShowUserList(true)}
                className="px-3 py-2 bg-blue-700 rounded hover:bg-blue-600 text-sm font-bold">
                👥 みんなのプール
              </button>
              <button onClick={() => setBannedChamps(new Set())}
                className="px-3 py-2 bg-red-700 rounded hover:bg-red-600 text-sm font-bold">
                BANリセット {bannedChamps.size > 0 && `(${bannedChamps.size})`}
              </button>
              <button onClick={() => router.push('/')}
                className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
                自分のページへ
              </button>
            </div>
        </div>

        {/* 相手チャンプ */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400 font-bold">相手チャンプ:</span>
            {enemyChamps.map(name => (
              <button key={name} onClick={() => toggleBan(name)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm border transition-all
                  ${bannedChamps.has(name)
                    ? 'opacity-50 border-red-700 bg-red-950'
                    : 'bg-red-900 border-red-500 hover:bg-red-800'}`}>
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className={`w-5 h-5 rounded-full ${bannedChamps.has(name) ? 'grayscale' : ''}`} />}
                <span className={bannedChamps.has(name) ? 'line-through text-red-300' : ''}>{name}</span>
                {bannedChamps.has(name)
                  ? <span className="text-red-300 ml-1 text-xs">BAN済</span>
                  : <span className="text-gray-400 ml-1 text-xs">BANする</span>}
              </button>
            ))}
            <button onClick={() => setShowEnemyPicker(true)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">+ 追加</button>
            {enemyChamps.length > 0 && (
              <button onClick={() => setEnemyChamps([])} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-400">クリア</button>
            )}
          </div>
        </div>

        {/* BAN欄 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-red-400 font-bold">🚫 BAN:</span>
            {Array.from(bannedChamps).map(name => (
              <button key={name} onClick={() => toggleBan(name)}
                className="flex items-center gap-1 bg-red-900 border border-red-500 px-2 py-1 rounded text-sm hover:bg-red-800 opacity-60">
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full grayscale" />}
                <span className="line-through text-red-300">{name}</span>
                <span className="text-red-300 ml-1">×</span>
              </button>
            ))}
            {bannedChamps.size === 0 && <span className="text-xs text-gray-500">なし</span>}
          </div>
        </div>

        {/* モード切り替え */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <button onClick={() => setViewMode('pool')}
            className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'pool' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
            ピックプール
          </button>
          <button onClick={fetchMastery}
            className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'mastery' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
            マスタリー順
          </button>
          <Tooltip text="このピックプールに対するカウンターチャンピオンたちを並べます">
            <button onClick={() => setViewMode('counter')}
              className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'counter' ? 'bg-teal-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
              カウンター
            </button>
          </Tooltip>
        </div>
        {/* フィルター */}
        <div className="mb-4">
          <input type="text" placeholder="チャンピオン名で検索..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full p-3 mb-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-400 focus:outline-none" />
          <div className="flex gap-2 flex-wrap mb-2">
            {LANES.map(l => (
              <button key={l} onClick={() => setLane(l)}
                className={`px-3 py-1 rounded font-bold text-sm ${lane === l ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedTag('全て')}
              className={`px-3 py-1 rounded font-bold text-sm ${selectedTag === '全て' ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
              全て
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded font-bold text-sm ${selectedTag === tag ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* チャンピオン一覧 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {sorted.map(name => {
            const pickInfo = getPickInfo(name)
            const isBanned = bannedChamps.has(name)
            const mu = matchups[name]
            const iconUrl = getChampionIcon(name)
            const score = getCounterScore(name)
            const poolCounterScore = getPoolCounterScore(name, lane)
            const isCounter = score > 0
            const isDisadvantage = score < 0
            const isSkillMatchup = enemyChamps.filter(e => !bannedChamps.has(e)).some(e => matchups[name]?.favorable.includes(e)) &&
                                  enemyChamps.filter(e => !bannedChamps.has(e)).some(e => matchups[name]?.unfavorable.includes(e))
            const champTags = getChampionTags(name)
            const champLanes = getChampionLanes(name)

            return (
              <div key={name}
                className={`relative rounded-lg p-2 flex flex-col items-center gap-1 border-2 transition-all
                  ${viewMode === 'counter'
                    ? isBanned ? 'opacity-40 border-red-700 bg-red-950'
                      : poolCounterScore >= 2 ? 'bg-red-950 border-red-500'
                      : 'bg-orange-950 border-orange-700'
                    : isBanned ? 'opacity-40 border-red-700 bg-red-950'
                    : enemyChamps.includes(name) && !bannedChamps.has(name) ? 'opacity-40 border-orange-500 bg-orange-950'
                    : isSkillMatchup ? 'bg-yellow-950 border-yellow-400'
                    : isCounter ? 'bg-green-950 border-green-400'
                    : isDisadvantage ? 'bg-red-950 border-red-800'
                    : `bg-gray-800 ${priorityBorder(pickInfo?.priority ?? 0)}`}
                `}>
                <button onClick={() => toggleBan(name)}
                  className={`absolute top-1 right-1 text-xs px-1 rounded ${isBanned ? 'bg-red-700' : 'bg-gray-700 hover:bg-red-700'}`}>
                  {isBanned ? '✕' : 'BAN'}
                </button>
                {viewMode === 'counter' ? (
                  <button onClick={() => setShowCounterScoreDetail(name)}
                    className="absolute top-1 left-1 text-xs font-bold px-1 rounded text-red-400 hover:bg-gray-700 transition-all">
                    {poolCounterScore % 1 === 0 ? poolCounterScore : poolCounterScore.toFixed(1)}
                  </button>
                ) : enemyChamps.filter(e => !bannedChamps.has(e)).length > 0 && (
                  <button onClick={() => setShowScoreDetail(name)}
                    className={`absolute top-1 left-1 text-xs font-bold px-1 rounded hover:bg-gray-700 transition-all ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {score > 0 ? `+${score}` : score === 0 ? '±0' : score}
                  </button>
                )}
                <div className="relative">
                  {iconUrl
                    ? <img src={iconUrl} alt={name} className="w-12 h-12 rounded-full" />
                    : <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xs text-center">{name}</div>
                  }
                </div>
                <p className="text-xs text-center font-bold leading-tight text-yellow-400">{name}</p>
                {champLanes.length > 0 && <p className="text-xs text-gray-400">{champLanes.join(' / ')}</p>}
                {champTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {champTags.map(tag => (
                      <span key={tag} className="text-xs bg-purple-900 text-purple-300 px-1 rounded">{tag}</span>
                    ))}
                  </div>
                )}
                {mu && (
                  <div className="flex gap-1 text-xs">
                    {mu.favorable.length > 0 && <span className="text-green-400">▲{mu.favorable.length}</span>}
                    {mu.unfavorable.length > 0 && <span className="text-red-400">▼{mu.unfavorable.length}</span>}
                  </div>
                )}
                {viewMode === 'mastery' && masteryData[name] && (
                  <p className="text-xs text-gray-500">{(masteryData[name] / 10000).toFixed(0)}万pts</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* カウンターモード：脅威スコア詳細モーダル */}
      {showCounterScoreDetail && (() => {
        const champName = showCounterScoreDetail
        const laneFilteredPool = lane === '全て' ? pickPool : pickPool.filter(p => {
          const pLanes = getChampionLanes(p.champion_name)
          return pLanes.length === 0 || pLanes.includes(lane)
        })
        const counteredPool = laneFilteredPool.filter(p => matchups[p.champion_name]?.unfavorable.includes(champName))
        const safePool = laneFilteredPool.filter(p => !matchups[p.champion_name]?.unfavorable.includes(champName))
        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                {getChampionIcon(champName) && <img src={getChampionIcon(champName)} alt={champName} className="w-10 h-10 rounded-full" />}
                <div>
                  <h2 className="text-lg font-bold text-white">{champName}</h2>
                  <span className="text-sm text-red-400 font-bold">
                    脅威スコア: {(() => { const s = getPoolCounterScore(champName, lane); return s % 1 === 0 ? s : s.toFixed(1) })()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">このチャンピオンに不利なピックプール</p>
              <div className="grid gap-2 max-h-80 overflow-y-auto">
                {counteredPool.map(p => (
                  <div key={p.champion_name} className="flex items-center gap-2 p-2 rounded border border-red-500 bg-red-950">
                    {getChampionIcon(p.champion_name) && <img src={getChampionIcon(p.champion_name)} alt={p.champion_name} className="w-7 h-7 rounded-full" />}
                    <span className="text-sm font-bold text-white">{p.champion_name}</span>
                    <span className="text-xs text-gray-400 ml-1">理解度{p.priority}</span>
                    <span className="text-xs text-red-400 ml-auto">▼ 不利</span>
                  </div>
                ))}
                {safePool.map(p => (
                  <div key={p.champion_name} className="flex items-center gap-2 p-2 rounded border border-gray-600 bg-gray-700 opacity-40">
                    {getChampionIcon(p.champion_name) && <img src={getChampionIcon(p.champion_name)} alt={p.champion_name} className="w-7 h-7 rounded-full" />}
                    <span className="text-sm font-bold text-gray-400">{p.champion_name}</span>
                    <span className="text-xs text-gray-500 ml-auto">− 有利/互角</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowCounterScoreDetail(null)}
                className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-4">閉じる</button>
            </div>
          </div>
        )
      })()}

      {/* 相手チャンプピッカー */}
      {showEnemyPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-red-400">相手チャンプを選択</h2>
            <input type="text" placeholder="検索..." value={enemySearch}
              onChange={e => setEnemySearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-red-400" />
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-4">
              {allChampions.filter(n => enemySearch === '' || n.includes(enemySearch)).map(name => {
                const isSelected = enemyChamps.includes(name)
                return (
                  <button key={name} onClick={() => toggleEnemy(name)}
                    className={`text-xs p-2 rounded flex items-center gap-1 border transition-all
                      ${isSelected ? 'border-red-400 bg-red-900' : 'border-gray-600 bg-gray-700 hover:border-red-400'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                    <span className="truncate">{name}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setShowEnemyPicker(false); setEnemySearch('') }}
              className="w-full p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">
              完了
            </button>
          </div>
        </div>
      )}
      {/* ユーザー一覧モーダル */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-blue-400">👥 みんなのピックプール</h2>
            <input type="text" placeholder="ユーザー名で検索..." value={userListSearch}
              onChange={e => setUserListSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-blue-400" />
            <div className="grid gap-2 max-h-96 overflow-y-auto mb-4">
              {userList.filter(u => userListSearch === '' || u.username.includes(userListSearch)).length === 0 &&
                <p className="text-gray-500 text-center py-4">ユーザーが見つかりません</p>}
              {userList.filter(u => userListSearch === '' || u.username.includes(userListSearch)).map(u => (
                <button key={u.id} onClick={() => { router.push(`/user/${u.username}`); setShowUserList(false) }}
                  className={`flex items-center justify-between p-3 rounded transition-all border ${u.username === decodeURIComponent(username) ? 'bg-blue-900 border-blue-400' : 'bg-gray-700 hover:bg-gray-600 border-transparent'}`}>
                  <span className="font-bold text-white">{u.username}</span>
                  <span className="text-gray-400 text-sm">{u.username === decodeURIComponent(username) ? '表示中' : '閲覧 →'}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setShowUserList(false); setUserListSearch('') }}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600">閉じる</button>
          </div>
        </div>
      )}
      {/* スコア詳細モーダル */}
      {showScoreDetail && (() => {
        const mu = matchups[showScoreDetail]
        const currentScore = getCounterScore(showScoreDetail)
        const scoreWithoutBans = (() => {
          if (!mu) return 0
          let s = 0
          enemyChamps.forEach(e => {
            if (mu.favorable.includes(e)) s += 1
            if (mu.unfavorable.includes(e)) s -= 1
          })
          return s
        })()

        return (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                {getChampionIcon(showScoreDetail) && <img src={getChampionIcon(showScoreDetail)} alt={showScoreDetail} className="w-10 h-10 rounded-full" />}
                <div>
                  <h2 className="text-lg font-bold text-white">{showScoreDetail}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${currentScore > 0 ? 'text-green-400' : currentScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      現在: {currentScore > 0 ? `+${currentScore}` : currentScore === 0 ? '±0' : currentScore}
                    </span>
                    {scoreWithoutBans !== currentScore && (
                      <span className="text-xs text-gray-400">
                        （BAN前: {scoreWithoutBans > 0 ? `+${scoreWithoutBans}` : scoreWithoutBans}）
                        <span className="text-yellow-400 ml-1">↑BAN効果あり</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 max-h-80 overflow-y-auto">
                {enemyChamps.map(enemy => {
                  const isFavorable = mu?.favorable.includes(enemy)
                  const isUnfavorable = mu?.unfavorable.includes(enemy)
                  const isSkill = isFavorable && isUnfavorable
                  const isBanned = bannedChamps.has(enemy)

                  return (
                    <button key={enemy} onClick={() => toggleBan(enemy)}
                      className={`flex items-center justify-between p-2 rounded border transition-all
                        ${isBanned ? 'opacity-40 border-gray-600 bg-gray-700'
                          : isSkill ? 'border-yellow-400 bg-yellow-950'
                          : isFavorable ? 'border-green-400 bg-green-950'
                          : isUnfavorable ? 'border-red-500 bg-red-950'
                          : 'border-gray-600 bg-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        {getChampionIcon(enemy) && <img src={getChampionIcon(enemy)} alt={enemy} className={`w-7 h-7 rounded-full ${isBanned ? 'grayscale' : ''}`} />}
                        <span className={`text-sm font-bold ${isBanned ? 'line-through text-gray-500' : 'text-white'}`}>{enemy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold
                          ${isSkill ? 'text-yellow-400' : isFavorable ? 'text-green-400' : isUnfavorable ? 'text-red-400' : 'text-gray-500'}`}>
                          {isSkill ? '● スキル' : isFavorable ? '▲ 有利' : isUnfavorable ? '▼ 不利' : '− ニュートラル'}
                        </span>
                        {!isBanned && (isUnfavorable || isSkill) && (
                          <span className="text-xs text-red-300 bg-red-900 px-1 rounded">BANで↑</span>
                        )}
                        {isBanned && <span className="text-xs text-gray-500">BAN済</span>}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button onClick={() => setShowScoreDetail(null)}
                className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-4">閉じる</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}