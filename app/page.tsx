'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getChampionIcon, championMap } from '@/lib/champions'

const LANES = ['全て', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
const TAGS = ['ファイター', 'タンク', 'マジシャン', 'アサシン', 'マークスマン', 'サポート', 'エンゲージ', 'スケーリング']

type PickPool = {
  id: string
  champion_name: string
  lane: string[]
  priority: number
  note: string
  tags: string[]
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

type MatchResult = {
  my_champion: string
  enemy_champion: string
  result: 'win' | 'lose'
}

type WinRate = {
  wins: number
  total: number
}

type UserTag = {
  id: string
  name: string
}

type FormType = {
  champion_name: string
  lane: string[]
  priority: number
  note: string
  tags: string[]
}

export default function Home() {
  const [pickPool, setPickPool] = useState<PickPool[]>([])
  const [championConfigs, setChampionConfigs] = useState<Record<string, ChampionConfig>>({})
  const [matchups, setMatchups] = useState<Record<string, Matchup>>({})
  const [lane, setLane] = useState('全て')
  const [search, setSearch] = useState('')
  const [bannedChamps, setBannedChamps] = useState<Set<string>>(new Set())
  const [enemyChamps, setEnemyChamps] = useState<string[]>([])
  const [enemySearch, setEnemySearch] = useState('')
  const [showEnemyPicker, setShowEnemyPicker] = useState(false)
  const [viewMode, setViewMode] = useState<'pool' | 'all'>('pool')
  const [showForm, setShowForm] = useState(false)
  const [editingChamp, setEditingChamp] = useState<PickPool | null>(null)
  const [selectedChamp, setSelectedChamp] = useState<string | null>(null)
  const [form, setForm] = useState<FormType>({ champion_name: '', lane: ['TOP'], priority: 3, note: '', tags: [] })
  const [matchupInput, setMatchupInput] = useState({ favorable: '', unfavorable: '' })
  const [favorableSearch, setFavorableSearch] = useState('')
  const [unfavorableSearch, setUnfavorableSearch] = useState('')
  const [matchResults, setMatchResults] = useState<Record<string, Record<string, WinRate>>>({})
  const [showResultForm, setShowResultForm] = useState(false)
  const [resultForm, setResultForm] = useState<{ myChamp: string, enemyChamp: string, enemySearch: string }>({ myChamp: '', enemyChamp: '', enemySearch: '' })
  const [currentPatch, setCurrentPatch] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState('全て')
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedTagForBulk, setSelectedTagForBulk] = useState<string | null>(null)
  const [bulkMode, setBulkMode] = useState<'tag' | 'lane' | null>(null)
  const [bulkTagChamps, setBulkTagChamps] = useState<string[]>([])
  const [bulkLaneChamps, setBulkLaneChamps] = useState<Record<string, string[]>>({})
  const [bulkSearch, setBulkSearch] = useState('')
  const [selectedLaneForBulk, setSelectedLaneForBulk] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const allChampions = Object.keys(championMap)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        .then(res => res.json())
        .then(versions => setCurrentPatch(versions[0]))
      fetchData()
    }
    getUser()
  }, [])

  const fetchData = async () => {
    const [{ data: pool }, { data: mu }, { data: results }, { data: defaultMu }, { data: userTagsData }, { data: configs }, { data: defaultConfigs }] = await Promise.all([
      supabase.from('pick_pool').select('*').order('priority', { ascending: false }),
      supabase.from('matchup').select('*'),
      supabase.from('match_result').select('*'),
      supabase.from('default_matchup').select('*'),
      supabase.from('user_tags').select('*').order('created_at'),
      supabase.from('champion_config').select('*'),
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
    if (results) {
      const map: Record<string, Record<string, WinRate>> = {}
      results.forEach((r: MatchResult & { my_champion: string, enemy_champion: string, result: string }) => {
        if (!map[r.my_champion]) map[r.my_champion] = {}
        if (!map[r.my_champion][r.enemy_champion]) map[r.my_champion][r.enemy_champion] = { wins: 0, total: 0 }
        map[r.my_champion][r.enemy_champion].total += 1
        if (r.result === 'win') map[r.my_champion][r.enemy_champion].wins += 1
      })
      setMatchResults(map)
    }
    if (userTagsData) setUserTags(userTagsData)
    if (configs) {
      const defaultMap: Record<string, ChampionConfig> = {}
      if (defaultConfigs) {
        defaultConfigs.forEach((c: ChampionConfig) => { defaultMap[c.champion_name] = c })
      }
      const map: Record<string, ChampionConfig> = { ...defaultMap }
      configs.forEach((c: ChampionConfig) => { map[c.champion_name] = c })
      setChampionConfigs(map)
    }
  }

  const getChampionTags = (name: string): string[] => {
    return championConfigs[name]?.tags || []
  }

  const getChampionLanes = (name: string): string[] => {
    const poolInfo = getPickInfo(name)
    if (poolInfo) return poolInfo.lane
    return championConfigs[name]?.lanes || []
  }

  const saveChampionConfig = async (name: string, updates: Partial<ChampionConfig>) => {
    const { data: { user } } = await supabase.auth.getUser()
    const existing = championConfigs[name]
    if (existing) {
      await supabase.from('champion_config').update(updates).eq('champion_name', name).eq('user_id', user!.id)
    } else {
      await supabase.from('champion_config').insert({ champion_name: name, lanes: [], tags: [], ...updates, user_id: user!.id })
    }
  }

  const toggleBan = (name: string) => {
    setBannedChamps(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleEnemy = (name: string) => {
    setEnemyChamps(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const getPickInfo = (name: string) => pickPool.find(p => p.champion_name === name)

  const getCounterScore = (name: string): number => {
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

  const isDangerous = (name: string): boolean => {
    if (viewMode !== 'all') return false
    if (pickPool.length === 0) return false
    const hasCounter = pickPool.some(p => {
      const mu = matchups[p.champion_name]
      return mu?.favorable.includes(name)
    })
    return !hasCounter
  }

  const openAdd = (name: string) => {
    setEditingChamp(null)
    const config = championConfigs[name]
    setForm({ champion_name: name, lane: config?.lanes?.length ? config.lanes : ['TOP'], priority: 3, note: '', tags: config?.tags || [] })
    setShowForm(true)
  }

  const openEdit = (p: PickPool) => {
    setEditingChamp(p)
    setForm({ champion_name: p.champion_name, lane: p.lane, priority: p.priority, note: p.note || '', tags: getChampionTags(p.champion_name) })
    setShowForm(true)
  }

  const saveChampion = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (editingChamp) {
      await supabase.from('pick_pool').update({ lane: form.lane, priority: form.priority, note: form.note }).eq('id', editingChamp.id)
    } else {
      await supabase.from('pick_pool').insert({ champion_name: form.champion_name, lane: form.lane, priority: form.priority, note: form.note, user_id: user!.id })
    }
    await saveChampionConfig(form.champion_name, { lanes: form.lane, tags: form.tags })
    setShowForm(false)
    fetchData()
  }

  const removeFromPool = async (id: string) => {
    await supabase.from('pick_pool').delete().eq('id', id)
    fetchData()
  }

  const saveMatchup = async (champName: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const favorable = matchupInput.favorable.split(',').map(s => s.trim()).filter(Boolean)
    const unfavorable = matchupInput.unfavorable.split(',').map(s => s.trim()).filter(Boolean)
    const existing = matchups[champName]
    if (existing) {
      await supabase.from('matchup').update({ favorable, unfavorable }).eq('champion_name', champName).eq('user_id', user!.id)
    } else {
      await supabase.from('matchup').insert({ champion_name: champName, favorable, unfavorable, user_id: user!.id })
    }
    for (const enemy of favorable) {
      const enemyMu = matchups[enemy]
      if (enemyMu) {
        const newUnfavorable = Array.from(new Set([...enemyMu.unfavorable, champName]))
        const newFavorable = enemyMu.favorable.filter(n => n !== champName)
        await supabase.from('matchup').update({ favorable: newFavorable, unfavorable: newUnfavorable }).eq('champion_name', enemy).eq('user_id', user!.id)
      } else {
        await supabase.from('matchup').insert({ champion_name: enemy, favorable: [], unfavorable: [champName], user_id: user!.id })
      }
    }
    for (const enemy of unfavorable) {
      const enemyMu = matchups[enemy]
      if (enemyMu) {
        const newFavorable = Array.from(new Set([...enemyMu.favorable, champName]))
        const newUnfavorable = enemyMu.unfavorable.filter(n => n !== champName)
        await supabase.from('matchup').update({ favorable: newFavorable, unfavorable: newUnfavorable }).eq('champion_name', enemy).eq('user_id', user!.id)
      } else {
        await supabase.from('matchup').insert({ champion_name: enemy, favorable: [champName], unfavorable: [], user_id: user!.id })
      }
    }
    fetchData()
    setSelectedChamp(null)
  }

  const saveMatchResult = async (myChamp: string, enemyChamp: string, result: 'win' | 'lose') => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('match_result').insert({ my_champion: myChamp, enemy_champion: enemyChamp, result, user_id: user!.id })
    fetchData()
  }

  const openMatchup = (name: string) => {
    setSelectedChamp(name)
    const mu = matchups[name]
    setMatchupInput({ favorable: mu?.favorable?.join(', ') || '', unfavorable: mu?.unfavorable?.join(', ') || '' })
  }

  const addTag = async () => {
    if (!newTagName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('user_tags').insert({ name: newTagName.trim(), user_id: user!.id })
    setNewTagName('')
    fetchData()
  }

  const deleteTag = async (id: string, tagName: string) => {
    await supabase.from('user_tags').delete().eq('id', id)
    const champsWithTag = Object.values(championConfigs).filter(c => c.tags?.includes(tagName))
    for (const champ of champsWithTag) {
      await saveChampionConfig(champ.champion_name, { tags: champ.tags.filter(t => t !== tagName) })
    }
    fetchData()
  }

  const openBulkTag = (tagName: string) => {
    setSelectedTagForBulk(tagName)
    setBulkMode('tag')
    const champsWithTag = allChampions.filter(name => getChampionTags(name).includes(tagName))
    setBulkTagChamps(champsWithTag)
    setBulkSearch('')
  }

  const openBulkLane = (laneName: string) => {
    setSelectedLaneForBulk(laneName)
    setBulkMode('lane')
    const map: Record<string, string[]> = {}
    allChampions.forEach(name => {
      map[name] = getChampionLanes(name)
    })
    setBulkLaneChamps(map)
    setBulkSearch('')
  }

  const saveBulkTag = async () => {
    if (!selectedTagForBulk) return
    for (const name of allChampions) {
      const currentTags = getChampionTags(name)
      const hasTag = currentTags.includes(selectedTagForBulk)
      const shouldHave = bulkTagChamps.includes(name)
      if (hasTag && !shouldHave) {
        await saveChampionConfig(name, { tags: currentTags.filter(t => t !== selectedTagForBulk) })
      } else if (!hasTag && shouldHave) {
        await saveChampionConfig(name, { tags: [...currentTags, selectedTagForBulk] })
      }
    }
    setSelectedTagForBulk(null)
    setBulkMode(null)
    fetchData()
  }

  const saveBulkLane = async () => {
    if (!selectedLaneForBulk) return
    for (const name of allChampions) {
      const currentLanes = getChampionLanes(name)
      const newLanes = bulkLaneChamps[name] || currentLanes
      if (JSON.stringify(currentLanes.sort()) !== JSON.stringify(newLanes.sort())) {
        const poolInfo = getPickInfo(name)
        if (poolInfo) {
          await supabase.from('pick_pool').update({ lane: newLanes }).eq('id', poolInfo.id)
        }
        await saveChampionConfig(name, { lanes: newLanes })
      }
    }
    setSelectedLaneForBulk(null)
    setBulkMode(null)
    fetchData()
  }

  const priorityBorder = (p: number) => {
    if (p >= 4) return 'border-yellow-400'
    if (p >= 2) return 'border-blue-400'
    return 'border-gray-500'
  }

  const displayChampions = viewMode === 'pool'
    ? pickPool.map(p => p.champion_name)
    : allChampions

  const uniqueDisplayChampions = Array.from(new Set(displayChampions))

  const filtered = uniqueDisplayChampions.filter(name => {
    if (search !== '' && !name.includes(search)) return false
    const info = getPickInfo(name)
    const lanes = getChampionLanes(name)
    if (lane !== '全て') {
      if (lanes.length > 0 && !lanes.includes(lane)) return false
    }
    if (selectedTag !== '全て') {
      if (!getChampionTags(name).includes(selectedTag)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const sa = getCounterScore(a)
    const sb = getCounterScore(b)
    if (sb !== sa) return sb - sa
    const pa = getPickInfo(a)?.priority ?? 0
    const pb = getPickInfo(b)?.priority ?? 0
    return pb - pa
  })

  const allTags = [...TAGS, ...userTags.map(t => t.name)]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">Pick Pool Tool</h1>
            {currentPatch && <p className="text-xs text-gray-400">Patch {currentPatch}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTagManager(true)}
              className="px-3 py-2 bg-purple-700 rounded hover:bg-purple-600 text-sm font-bold">
              タグ・レーン管理
            </button>
            <button onClick={() => setBannedChamps(new Set())}
              className="px-3 py-2 bg-red-700 rounded hover:bg-red-600 text-sm font-bold">
              BANリセット {bannedChamps.size > 0 && `(${bannedChamps.size})`}
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
              ログアウト
            </button>
          </div>
        </div>

        {/* 相手チャンプ選択 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400 font-bold">相手チャンプ:</span>
            {enemyChamps.map(name => (
              <button key={name} onClick={() => toggleEnemy(name)}
                className="flex items-center gap-1 bg-red-900 border border-red-500 px-2 py-1 rounded text-sm hover:bg-red-800">
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                {name}
                <span className="text-red-300 ml-1">×</span>
              </button>
            ))}
            <button onClick={() => setShowEnemyPicker(true)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              + 追加
            </button>
            {enemyChamps.length > 0 && (
              <button onClick={() => setEnemyChamps([])}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-400">
                クリア
              </button>
            )}
          </div>
        </div>

        {/* モード切り替え・検索・フィルター */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setViewMode('pool')}
              className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'pool' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
              ピックプール
            </button>
            <button onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'all' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
              全チャンプ
            </button>
          </div>
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
          <div className="flex gap-2 flex-wrap mt-2">
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
            const isInPool = !!pickInfo
            const mu = matchups[name]
            const iconUrl = getChampionIcon(name)
            const score = getCounterScore(name)
            const isCounter = score > 0
            const isDisadvantage = score < 0
            const champTags = getChampionTags(name)
            const champLanes = getChampionLanes(name)

            return (
              <div key={name}
                className={`relative rounded-lg p-2 flex flex-col items-center gap-1 border-2 transition-all
                  ${isBanned ? 'opacity-40 border-red-700 bg-red-950'
                    : enemyChamps.includes(name) ? 'opacity-40 border-orange-500 bg-orange-950'
                    : isCounter ? 'bg-green-950 border-green-400'
                    : isDisadvantage ? 'bg-red-950 border-red-800'
                    : isInPool ? `bg-gray-800 ${priorityBorder(pickInfo!.priority)}`
                    : 'bg-gray-850 border-gray-700 opacity-50'}
                `}>

                <button onClick={() => toggleBan(name)}
                  className={`absolute top-1 right-1 text-xs px-1 rounded ${isBanned ? 'bg-red-700' : 'bg-gray-700 hover:bg-red-700'}`}>
                  {isBanned ? '✕' : 'BAN'}
                </button>

                {score !== 0 && (
                  <span className={`absolute top-1 left-1 text-xs font-bold ${score > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {score > 0 ? `+${score}` : score}
                  </span>
                )}

                <div className="relative">
                  {iconUrl
                    ? <img src={iconUrl} alt={name} className="w-12 h-12 rounded-full" />
                    : <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xs text-center">{name}</div>
                  }
                  {isDangerous(name) && (
                    <span className="absolute -top-1 -left-1 text-lg" title="このチャンプへのカウンターがピックプールにいません">⚠️</span>
                  )}
                </div>

                <p className={`text-xs text-center font-bold leading-tight ${isInPool ? 'text-yellow-400' : 'text-gray-300'}`}>{name}</p>

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

                <div className="flex gap-1 mt-1">
                  {isInPool
                    ? <button onClick={() => openEdit(pickInfo)} className="text-xs bg-blue-700 hover:bg-blue-600 px-1 rounded">編集</button>
                    : <button onClick={() => openAdd(name)} className="text-xs bg-yellow-600 hover:bg-yellow-500 px-1 rounded">追加</button>
                  }
                  <button onClick={() => openMatchup(name)} className="text-xs bg-gray-600 hover:bg-gray-500 px-1 rounded">対面</button>
                  {isInPool && (
                    <button onClick={() => { setResultForm({ myChamp: name, enemyChamp: enemyChamps.length === 1 ? enemyChamps[0] : '', enemySearch: '' }); setShowResultForm(true) }}
                      className="text-xs bg-green-700 hover:bg-green-600 px-1 rounded">記録</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
                const isBanned = bannedChamps.has(name)
                return (
                  <button key={name} onClick={() => toggleEnemy(name)}
                    className={`text-xs p-2 rounded flex items-center gap-1 border transition-all
                      ${isBanned ? 'opacity-30 border-gray-700 bg-gray-700'
                        : isSelected ? 'border-red-400 bg-red-900'
                        : 'border-gray-600 bg-gray-700 hover:border-red-400'}`}>
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

      {/* 追加・編集フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              {editingChamp ? '編集' : '追加'}: {form.champion_name}
            </h2>
            <div className="mb-3">
              <p className="text-sm text-gray-400 mb-1">レーン（複数選択可）</p>
              <div className="flex gap-2 flex-wrap">
                {LANES.filter(l => l !== '全て').map(l => (
                  <button key={l} type="button"
                    onClick={() => {
                      const current = form.lane
                      const next = current.includes(l) ? current.filter(x => x !== l) : [...current, l]
                      setForm({ ...form, lane: next.length > 0 ? next : [l] })
                    }}
                    className={`px-3 py-1 rounded text-sm font-bold ${form.lane.includes(l) ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-400 mb-1">優先度: {form.priority}</p>
              <input type="range" min="1" max="5" value={form.priority}
                onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full" />
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-400 mb-1">タグ（複数選択可）</p>
              <div className="flex gap-2 flex-wrap">
                {allTags.map(tag => (
                  <button key={tag} type="button"
                    onClick={() => {
                      const current = form.tags || []
                      const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
                      setForm({ ...form, tags: next })
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold ${(form.tags || []).includes(tag) ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <input placeholder="メモ（任意）" value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-700" />
            <div className="flex gap-3">
              <button onClick={saveChampion} className="flex-1 p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">
                {editingChamp ? '保存' : '追加'}
              </button>
              {editingChamp && (
                <button onClick={() => { removeFromPool(editingChamp.id); setShowForm(false) }}
                  className="flex-1 p-2 bg-red-700 text-white font-bold rounded hover:bg-red-600">
                  削除
                </button>
              )}
              <button onClick={() => setShowForm(false)} className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 対面設定フォーム */}
      {selectedChamp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">{selectedChamp} の対面設定</h2>
            <p className="text-sm text-green-400 font-bold mb-2">▲ 有利な相手</p>
            <input type="text" placeholder="検索..." value={favorableSearch}
              onChange={e => setFavorableSearch(e.target.value)}
              className="w-full p-2 mb-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-green-400" />
            <div className="grid grid-cols-4 gap-2 mb-3 max-h-40 overflow-y-auto">
              {allChampions.filter(n => n !== selectedChamp && (favorableSearch === '' || n.includes(favorableSearch))).map(name => {
                const isBanned = bannedChamps.has(name)
                const isSelected = matchupInput.favorable.split(',').map(s => s.trim()).includes(name)
                return (
                  <button key={name} onClick={() => {
                    const current = matchupInput.favorable.split(',').map(s => s.trim()).filter(Boolean)
                    const next = isSelected ? current.filter(n => n !== name) : [...current, name]
                    setMatchupInput({ ...matchupInput, favorable: next.join(', ') })
                  }}
                    className={`text-xs p-1 rounded flex items-center gap-1 border transition-all
                      ${isBanned ? 'opacity-30 border-gray-700 bg-gray-700'
                        : isSelected ? 'border-green-400 bg-green-900'
                        : 'border-gray-600 bg-gray-700 hover:border-green-400'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                    <span className="truncate">{name}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-red-400 font-bold mb-2">▼ 不利な相手</p>
            <input type="text" placeholder="検索..." value={unfavorableSearch}
              onChange={e => setUnfavorableSearch(e.target.value)}
              className="w-full p-2 mb-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-red-400" />
            <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
              {allChampions.filter(n => n !== selectedChamp && (unfavorableSearch === '' || n.includes(unfavorableSearch))).map(name => {
                const isBanned = bannedChamps.has(name)
                const isSelected = matchupInput.unfavorable.split(',').map(s => s.trim()).includes(name)
                return (
                  <button key={name} onClick={() => {
                    const current = matchupInput.unfavorable.split(',').map(s => s.trim()).filter(Boolean)
                    const next = isSelected ? current.filter(n => n !== name) : [...current, name]
                    setMatchupInput({ ...matchupInput, unfavorable: next.join(', ') })
                  }}
                    className={`text-xs p-1 rounded flex items-center gap-1 border transition-all
                      ${isBanned ? 'opacity-30 border-gray-700 bg-gray-700'
                        : isSelected ? 'border-red-400 bg-red-900'
                        : 'border-gray-600 bg-gray-700 hover:border-red-400'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                    <span className="truncate">{name}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveMatchup(selectedChamp)} className="flex-1 p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">保存</button>
              <button onClick={() => { setSelectedChamp(null); setFavorableSearch(''); setUnfavorableSearch('') }}
                className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 試合結果フォーム */}
      {showResultForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 text-yellow-400">試合結果を記録</h2>
            <p className="text-gray-400 text-sm mb-4">自チャンプ: <span className="text-white font-bold">{resultForm.myChamp}</span></p>
            <p className="text-sm text-gray-400 mb-2">相手チャンプを選択</p>
            <input type="text" placeholder="検索..." value={resultForm.enemySearch}
              onChange={e => setResultForm({ ...resultForm, enemySearch: e.target.value })}
              className="w-full p-2 mb-2 rounded bg-gray-700 focus:outline-none border border-gray-600" />
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto mb-4">
              {(enemyChamps.length > 0 ? enemyChamps : allChampions).filter(n => n !== resultForm.myChamp && (resultForm.enemySearch === '' || n.includes(resultForm.enemySearch))).map(name => {
                const wr = matchResults[resultForm.myChamp]?.[name]
                const wrText = wr ? `${Math.round(wr.wins / wr.total * 100)}%(${wr.total})` : ''
                return (
                  <button key={name} onClick={() => setResultForm({ ...resultForm, enemyChamp: name })}
                    className={`text-xs p-1 rounded flex flex-col items-center gap-1 border transition-all
                      ${resultForm.enemyChamp === name ? 'border-yellow-400 bg-yellow-900' : 'border-gray-600 bg-gray-700 hover:border-yellow-400'}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                    <span className="truncate w-full text-center">{name}</span>
                    {wrText && <span className="text-xs text-gray-400">{wrText}</span>}
                  </button>
                )
              })}
            </div>
            {resultForm.enemyChamp && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">対 <span className="text-white font-bold">{resultForm.enemyChamp}</span> の結果</p>
                {matchResults[resultForm.myChamp]?.[resultForm.enemyChamp] && (
                  <p className="text-sm text-gray-400 mb-2">
                    現在の勝率: <span className="text-yellow-400 font-bold">
                      {Math.round(matchResults[resultForm.myChamp][resultForm.enemyChamp].wins / matchResults[resultForm.myChamp][resultForm.enemyChamp].total * 100)}%
                    </span>
                    （{matchResults[resultForm.myChamp][resultForm.enemyChamp].wins}勝
                    {matchResults[resultForm.myChamp][resultForm.enemyChamp].total - matchResults[resultForm.myChamp][resultForm.enemyChamp].wins}敗）
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { saveMatchResult(resultForm.myChamp, resultForm.enemyChamp, 'win'); setShowResultForm(false) }}
                    className="flex-1 p-3 bg-blue-600 hover:bg-blue-500 font-bold rounded text-lg">
                    勝ち 🏆
                  </button>
                  <button onClick={() => { saveMatchResult(resultForm.myChamp, resultForm.enemyChamp, 'lose'); setShowResultForm(false) }}
                    className="flex-1 p-3 bg-red-700 hover:bg-red-600 font-bold rounded text-lg">
                    負け 💀
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setShowResultForm(false)} className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-2">キャンセル</button>
          </div>
        </div>
      )}

      {/* タグ・レーン管理 */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-purple-400">タグ・レーン管理</h2>

            {!bulkMode ? (
              <>
                {/* タグセクション */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-purple-300 mb-3">タグ管理</h3>
                  <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="新しいタグ名..." value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTag()}
                      className="flex-1 p-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-purple-400" />
                    <button onClick={addTag} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold">追加</button>
                  </div>
                  <div className="grid gap-2">
                    {TAGS.map(tag => (
                      <div key={`default-${tag}`} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span className="text-purple-300 font-bold">{tag} <span className="text-xs text-gray-500">（デフォルト）</span></span>
                        <button onClick={() => openBulkTag(tag)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm">チャンプ一括設定</button>
                      </div>
                    ))}
                    {userTags.map(tag => (
                      <div key={tag.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span className="text-purple-300 font-bold">{tag.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => openBulkTag(tag.name)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm">チャンプ一括設定</button>
                          <button onClick={() => deleteTag(tag.id, tag.name)} className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm">削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* レーンセクション */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-yellow-300 mb-3">レーン一括設定</h3>
                  <div className="grid gap-2">
                    {LANES.filter(l => l !== '全て').map(l => (
                      <div key={l} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <span className="text-yellow-300 font-bold">{l}</span>
                        <button onClick={() => openBulkLane(l)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm">チャンプ一括設定</button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : bulkMode === 'tag' ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => { setBulkMode(null); setSelectedTagForBulk(null) }} className="text-gray-400 hover:text-white">← 戻る</button>
                  <h3 className="text-lg font-bold text-purple-300">「{selectedTagForBulk}」のチャンプ設定</h3>
                </div>
                <input type="text" placeholder="検索..." value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                  className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600" />
                <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto mb-4">
                  {allChampions.filter(n => bulkSearch === '' || n.includes(bulkSearch)).map(name => {
                    const isSelected = bulkTagChamps.includes(name)
                    const isInPool = !!getPickInfo(name)
                    return (
                      <button key={name} onClick={() => setBulkTagChamps(prev => prev.includes(name) ? prev.filter(n2 => n2 !== name) : [...prev, name])}
                        className={`text-xs p-1 rounded flex items-center gap-1 border transition-all
                          ${isSelected && isInPool ? 'border-purple-400 bg-purple-900'
                            : isSelected ? 'border-purple-400 bg-purple-950'
                            : isInPool ? 'border-yellow-600 bg-gray-700 hover:border-purple-400'
                            : 'border-gray-600 bg-gray-700 hover:border-purple-400'}`}>
                        {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                        <span className="truncate">{name}</span>
                      </button>
                    )
                  })}
                </div>
                <button onClick={saveBulkTag} className="w-full p-2 bg-purple-600 hover:bg-purple-500 font-bold rounded">保存</button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => { setBulkMode(null); setSelectedLaneForBulk(null) }} className="text-gray-400 hover:text-white">← 戻る</button>
                  <h3 className="text-lg font-bold text-yellow-300">「{selectedLaneForBulk}」のチャンプ設定</h3>
                </div>
                <input type="text" placeholder="検索..." value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                  className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600" />
                <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto mb-4">
                  {allChampions.filter(n => bulkSearch === '' || n.includes(bulkSearch)).map(name => {
                    const currentLanes = bulkLaneChamps[name] || []
                    const isSelected = currentLanes.includes(selectedLaneForBulk!)
                    const isInPool = !!getPickInfo(name)
                    return (
                      <button key={name} onClick={() => {
                        const current = bulkLaneChamps[name] || []
                        const next = isSelected ? current.filter(l => l !== selectedLaneForBulk) : [...current, selectedLaneForBulk!]
                        setBulkLaneChamps(prev => ({ ...prev, [name]: next }))
                      }}
                        className={`text-xs p-1 rounded flex items-center gap-1 border transition-all
                          ${isSelected && isInPool ? 'border-yellow-400 bg-yellow-900'
                            : isSelected ? 'border-yellow-400 bg-yellow-950'
                            : isInPool ? 'border-blue-500 bg-gray-700 hover:border-yellow-400'
                            : 'border-gray-600 bg-gray-700 hover:border-yellow-400'}`}>
                        {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-6 h-6 rounded-full" />}
                        <span className="truncate">{name}</span>
                      </button>
                    )
                  })}
                </div>
                <button onClick={saveBulkLane} className="w-full p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">保存</button>
              </div>
            )}

            <button onClick={() => { setShowTagManager(false); setBulkMode(null); setSelectedTagForBulk(null); setSelectedLaneForBulk(null) }}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-3">閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}