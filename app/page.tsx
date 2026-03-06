'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getChampionIcon, championMap } from '@/lib/champions'
import { ExternalLink, Pencil, Link, Users, Swords, LogOut } from 'lucide-react'

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
  const [selectedMatchupChamp, setSelectedMatchupChamp] = useState<string | null>(null)
  const [bulkMatchupMode, setBulkMatchupMode] = useState<'favorable' | 'unfavorable' | 'skill' | 'none' | null>(null)
  const [enemyLane, setEnemyLane] = useState('全て')
  const [enemyTag, setEnemyTag] = useState('全て')
  const [username, setUsername] = useState<string | null>(null)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [showUserList, setShowUserList] = useState(false)
  const [userList, setUserList] = useState<{id: string, username: string}[]>([])
  const [userListSearch, setUserListSearch] = useState('')
  const [showLolalyticsModal, setShowLolalyticsModal] = useState(false)
  const [lolalyticsChamp, setLolalyticsChamp] = useState<string | null>(null)
  const [riotId, setRiotId] = useState<string | null>(null)
  const [newRiotId, setNewRiotId] = useState('')
  const [showRiotIdModal, setShowRiotIdModal] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null)
  const [masteryData, setMasteryData] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState<'pool' | 'all' | 'mastery'>('pool')
  const [newRiotIdName, setNewRiotIdName] = useState('')
  const [newRiotIdTag, setNewRiotIdTag] = useState('')
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
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: pool }, { data: mu }, { data: results }, { data: defaultMu }, { data: userTagsData }, { data: configs }, { data: defaultConfigs }, { data: profileData }, { data: allProfiles }] = await Promise.all([
      supabase.from('pick_pool').select('*').eq('user_id', user!.id).order('priority', { ascending: false }),
      supabase.from('matchup').select('*'),
      supabase.from('match_result').select('*'),
      supabase.from('default_matchup').select('*'),
      supabase.from('user_tags').select('*').order('created_at'),
      supabase.from('champion_config').select('*'),
      supabase.from('default_champion_config').select('*'),
      supabase.from('profile').select('username, riot_id').eq('id', user!.id).maybeSingle(),
      supabase.from('profile').select('id, username').order('username')
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
    if (profileData) {
      setUsername(profileData.username)
      setRiotId(profileData.riot_id)
    }
    if (allProfiles) setUserList(allProfiles)
  }

  const fetchMastery = async () => {
    if (!riotId) {
      setShowRiotIdModal(true)
      return
    }
    const res = await fetch(`/api/mastery?riotId=${encodeURIComponent(riotId)}`)
    const data = await res.json()
    if (data.error) {
      alert('マスタリー取得に失敗しました: ' + data.error)
      return
    }
    setMasteryData(data.mastery)
    setViewMode('mastery')
  }

  const saveRiotId = async (riotIdValue?: string) => {
    const value = riotIdValue || newRiotId
    if (!value.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profile').update({ riot_id: value.trim() }).eq('id', user!.id)
    setRiotId(value.trim())
    setShowRiotIdModal(false)
  }

  const saveUsername = async () => {
    if (!newUsername.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profile').upsert({ id: user!.id, username: newUsername.trim() }, { onConflict: 'id' })
    if (error) {
      setUsernameError('このユーザー名は既に使われています')
      return
    }
    setUsername(newUsername.trim())
    setShowUsernameModal(false)
    setUsernameError('')
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
    enemyChamps.filter(e => !bannedChamps.has(e)).forEach(enemy => {
      if (mu.favorable.includes(enemy)) score += 1
      if (mu.unfavorable.includes(enemy)) score -= 1
    })
    return score
  }

  const isDangerous = (name: string): boolean => {
    if (viewMode !== 'all') return false
    if (pickPool.length === 0) return false
    const activeEnemies = enemyChamps.filter(e => !bannedChamps.has(e))
    if (activeEnemies.length === 0) return false
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
    const skill = favorable.filter(n => unfavorable.includes(n))

    const existing = matchups[champName]
    if (existing) {
      await supabase.from('matchup').update({ favorable, unfavorable }).eq('champion_name', champName).eq('user_id', user!.id)
    } else {
      await supabase.from('matchup').insert({ champion_name: champName, favorable, unfavorable, user_id: user!.id })
    }

    // 有利のみ（スキル以外）→相手に不利を設定
    for (const enemy of favorable.filter(n => !skill.includes(n))) {
      const enemyMu = matchups[enemy]
      if (enemyMu) {
        const newUnfavorable = Array.from(new Set([...enemyMu.unfavorable.filter(n => n !== champName), champName]))
        const newFavorable = enemyMu.favorable.filter(n => n !== champName)
        await supabase.from('matchup').update({ favorable: newFavorable, unfavorable: newUnfavorable }).eq('champion_name', enemy).eq('user_id', user!.id)
      } else {
        await supabase.from('matchup').insert({ champion_name: enemy, favorable: [], unfavorable: [champName], user_id: user!.id })
      }
    }

    // 不利のみ（スキル以外）→相手に有利を設定
    for (const enemy of unfavorable.filter(n => !skill.includes(n))) {
      const enemyMu = matchups[enemy]
      if (enemyMu) {
        const newFavorable = Array.from(new Set([...enemyMu.favorable.filter(n => n !== champName), champName]))
        const newUnfavorable = enemyMu.unfavorable.filter(n => n !== champName)
        await supabase.from('matchup').update({ favorable: newFavorable, unfavorable: newUnfavorable }).eq('champion_name', enemy).eq('user_id', user!.id)
      } else {
        await supabase.from('matchup').insert({ champion_name: enemy, favorable: [champName], unfavorable: [], user_id: user!.id })
      }
    }

    // スキルマッチアップ→相手にも両方設定
    for (const enemy of skill) {
      const enemyMu = matchups[enemy]
      if (enemyMu) {
        const newFavorable = Array.from(new Set([...enemyMu.favorable, champName]))
        const newUnfavorable = Array.from(new Set([...enemyMu.unfavorable, champName]))
        await supabase.from('matchup').update({ favorable: newFavorable, unfavorable: newUnfavorable }).eq('champion_name', enemy).eq('user_id', user!.id)
      } else {
        await supabase.from('matchup').insert({ champion_name: enemy, favorable: [champName], unfavorable: [champName], user_id: user!.id })
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

  const handleMatchupChampClick = (name: string) => {
    if (bulkMatchupMode) {
      setMatchupType(name, bulkMatchupMode)
    } else {
      setSelectedMatchupChamp(prev => prev === name ? null : name)
    }
  }

  const setMatchupType = (name: string, type: 'favorable' | 'unfavorable' | 'skill' | 'none') => {
    const favorable = matchupInput.favorable.split(',').map(s => s.trim()).filter(Boolean)
    const unfavorable = matchupInput.unfavorable.split(',').map(s => s.trim()).filter(Boolean)
    let newFavorable = [...favorable]
    let newUnfavorable = [...unfavorable]

    if (type === 'favorable') {
      if (!newFavorable.includes(name)) newFavorable.push(name)
      newUnfavorable = newUnfavorable.filter(n => n !== name)
    } else if (type === 'unfavorable') {
      if (!newUnfavorable.includes(name)) newUnfavorable.push(name)
      newFavorable = newFavorable.filter(n => n !== name)
    } else if (type === 'skill') {
      if (!newFavorable.includes(name)) newFavorable.push(name)
      if (!newUnfavorable.includes(name)) newUnfavorable.push(name)
    } else {
      newFavorable = newFavorable.filter(n => n !== name)
      newUnfavorable = newUnfavorable.filter(n => n !== name)
    }

    setMatchupInput({ favorable: newFavorable.join(', '), unfavorable: newUnfavorable.join(', ') })
    setSelectedMatchupChamp(null)
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
    : viewMode === 'mastery'
    ? Object.keys(masteryData)
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

  const maxPossibleScore = enemyChamps.filter(e => !bannedChamps.has(e)).length
  const rainbowThreshold = Math.floor(maxPossibleScore * 0.8)
  const isRainbow = (name: string) => enemyChamps.length > 0 && rainbowThreshold > 0 && (getCounterScore(name) >= rainbowThreshold && enemyChamps.length >= 3)

  const sorted = [...filtered].sort((a, b) => {
    const sa = getCounterScore(a)
    const sb = getCounterScore(b)

    const aSkill = enemyChamps.some(e => matchups[a]?.favorable.includes(e)) &&
                   enemyChamps.some(e => matchups[a]?.unfavorable.includes(e))
    const bSkill = enemyChamps.some(e => matchups[b]?.favorable.includes(e)) &&
                   enemyChamps.some(e => matchups[b]?.unfavorable.includes(e))

    if (viewMode === 'mastery') {
      return (masteryData[b] ?? 0) - (masteryData[a] ?? 0)
    }

    if (viewMode === 'all') {
      // 全チャンプモード：カウンタースコア純粋に並べる
      if (sb !== sa) return sb - sa
      return 0
    }

    // ピックプールモード：グループ分けしてから優先度
    if (enemyChamps.length > 0) {
      const aGroup = sa > 0 ? 0 : aSkill ? 1 : sa === 0 ? 2 : 3
      const bGroup = sb > 0 ? 0 : bSkill ? 1 : sb === 0 ? 2 : 3
      if (aGroup !== bGroup) return aGroup - bGroup
    } else {
      if (sb !== sa) return sb - sa
    }

    const pa = getPickInfo(a)?.priority ?? 0
    const pb = getPickInfo(b)?.priority ?? 0
    return pb - pa
  })

  const allTags = [...TAGS, ...userTags.map(t => t.name)]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">

        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">Pick Pool Tool</h1>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {riotId ? (
              <div className="flex gap-1">
                <div className="relative group/opgghdr">
                  <button onClick={() => window.open(`https://www.op.gg/summoners/jp/${encodeURIComponent(riotId.replace('#', '-'))}`, '_blank')}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-orange-800 rounded hover:bg-orange-700 text-sm flex items-center gap-1">
                    OP.GG <ExternalLink size={12} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/opgghdr:opacity-100 transition-opacity z-20 pointer-events-none">
                    あなたのプロフィールを開きます
                  </div>
                </div>
                <div className="relative group/opggEdit">
                  <button onClick={() => {
                      if (riotId) {
                        const [name, tag] = riotId.split('#')
                        setNewRiotIdName(name || '')
                        setNewRiotIdTag(tag || '')
                      } else {
                        setNewRiotIdName('')
                        setNewRiotIdTag('')
                      }
                      setShowRiotIdModal(true)
                    }}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-orange-800 rounded-r hover:bg-orange-700 text-sm flex items-center justify-center h-full">
                    <Pencil size={14} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/opggEdit:opacity-100 transition-opacity z-20 pointer-events-none">
                    RiotIDを変更します
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => {
                    setNewRiotIdName('')
                    setNewRiotIdTag('')
                    setShowRiotIdModal(true)
                  }}
                className="px-2 py-1 sm:px-3 sm:py-2 bg-orange-800 rounded hover:bg-orange-700 text-sm flex items-center gap-1">
                RiotID設定
              </button>
            )}
            {username ? (
              <div className="flex gap-1">
                <div className="relative group/usernameBtn">
                  <button onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/user/${username}`)
                    alert('リンクをコピーしました！')
                  }}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm flex items-center gap-1">
                    <Link size={14} /> {username}
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/usernameBtn:opacity-100 transition-opacity z-20 pointer-events-none">
                    あなたのプロフィールリンクをコピーします
                  </div>
                </div>
                <div className="relative group/usernameEdit">
                  <button onClick={() => { setNewUsername(username!); setShowUsernameModal(true) }}
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-600 rounded-r hover:bg-gray-500 text-sm flex items-center justify-center h-full">
                    <Pencil size={14} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/usernameEdit:opacity-100 transition-opacity z-20 pointer-events-none">
                    あなたのユーザー名を変更します
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowUsernameModal(true)}
                className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm flex items-center gap-1">
                ユーザー名を設定
              </button>
            )}
            <button onClick={() => router.push('/match')}
              className="px-2 py-1 sm:px-3 sm:py-2 bg-green-700 rounded hover:bg-green-600 text-sm font-bold flex items-center gap-1">
              <Swords size={14} /> 試合
            </button>
            <button onClick={() => setShowUserList(true)}
              className="px-2 py-1 sm:px-3 sm:py-2 bg-blue-700 rounded hover:bg-blue-600 text-sm font-bold flex items-center gap-1">
              <Users size={14} /> みんなのプール
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm flex items-center gap-1">
              <LogOut size={14} /> ログアウト
            </button>
          </div>
        </div>

        {/* 相手チャンプ選択 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400 font-bold">相手チャンプ:</span>
            <div className="relative group/enemyHelp">
              <span className="text-xs text-gray-500 bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center cursor-default">?</span>
              <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/enemyHelp:opacity-100 transition-opacity z-20 pointer-events-none">
                相手が使用するチャンピオンor相手の人が使用するかもしれないチャンピオン（ピックプール）を選択します
              </div>
            </div>
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

        {/* モード切り替え・検索・フィルター */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3 items-center flex-wrap">
            <button onClick={() => setViewMode('pool')}
              className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'pool' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
              マイピックプール
            </button>
            <button onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'all' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
              全チャンプ
            </button>
            <div className="relative group/mastery">
              <button onClick={fetchMastery}
                className={`px-4 py-2 rounded font-bold text-sm ${viewMode === 'mastery' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                マスタリー順
              </button>
              {!riotId && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/mastery:opacity-100 transition-opacity z-20 pointer-events-none">
                  RiotIDを設定してください
                </div>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setShowTagManager(true)}
                className="px-3 py-2 bg-purple-700 rounded hover:bg-purple-600 text-sm font-bold">
                タグ・レーン管理
              </button>
              <button onClick={() => setBannedChamps(new Set())}
                className="px-3 py-2 bg-red-700 rounded hover:bg-red-600 text-sm font-bold">
                BANリセット {bannedChamps.size > 0 && `(${bannedChamps.size})`}
              </button>
            </div>
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
          {viewMode === 'pool' && sorted.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 text-lg mb-2">あなたのピックプールがありません</p>
              <p className="text-gray-600 text-sm">
                <button onClick={() => setViewMode('all')} className="text-yellow-400 hover:text-yellow-300 underline">全チャンプ</button>
                でチャンピオンを追加してください
              </p>
            </div>
          )}
          {sorted.map(name => {
            const pickInfo = getPickInfo(name)
            const isBanned = bannedChamps.has(name)
            const isInPool = !!pickInfo
            const mu = matchups[name]
            const iconUrl = getChampionIcon(name)
            const score = getCounterScore(name)
            const isCounter = score > 0
            const isDisadvantage = score < 0
            const isSkillMatchup = enemyChamps.filter(e => !bannedChamps.has(e)).some(e => matchups[name]?.favorable.includes(e)) &&
                                  enemyChamps.filter(e => !bannedChamps.has(e)).some(e => matchups[name]?.unfavorable.includes(e))
            const champTags = getChampionTags(name)
            const champLanes = getChampionLanes(name)

            return (
                <div key={name}
                  onClick={() => !isInPool ? openAdd(name) : undefined}
                  className={`relative rounded-lg p-2 flex flex-col items-center gap-1 border-2 transition-all group
                    ${!isInPool ? 'cursor-pointer' : ''}
                    ${isBanned ? 'opacity-40 border-red-700 bg-red-950'
                      : enemyChamps.includes(name) && !bannedChamps.has(name) ? 'opacity-40 border-orange-500 bg-orange-950'
                      : isRainbow(name) ? `${!isInPool ? 'opacity-60' : ''} rainbow-border`
                      : isSkillMatchup ? `bg-yellow-950 border-yellow-400 ${!isInPool ? 'opacity-60' : ''}`
                      : isCounter ? `bg-green-950 border-green-400 ${!isInPool ? 'opacity-60' : ''}`
                      : isDisadvantage ? `bg-red-950 border-red-800 ${!isInPool ? 'opacity-60' : ''}`
                      : isInPool ? `bg-gray-800 ${priorityBorder(pickInfo!.priority)}`
                      : 'bg-gray-800 border-gray-600 opacity-60'
                    }
                  `}>
                    {/* ピックプール未追加時のホバーメッセージ */}
                    {!isInPool && (
                      <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none rounded-lg z-10">
                        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center px-1 bg-black bg-opacity-70 rounded">
                          + ピックプールに加える
                        </span>
                      </div>
                    )}

                {enemyChamps.length > 0 && (
                  <div className="relative group/score absolute top-1 left-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isInPool) setShowScoreDetail(name) }}
                      className={`text-xs font-bold px-1 rounded transition-all
                        ${!isInPool ? 'text-gray-600 cursor-default' : score > 0 ? 'text-green-400 hover:bg-gray-700' : score < 0 ? 'text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-700'}`}>
                      {score > 0 ? `+${score}` : score === 0 ? '±0' : score}
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/score:opacity-100 transition-opacity z-20 pointer-events-none">
                      {isInPool ? '設定された対面に対する詳細を表示' : ''}
                    </div>
                  </div>
                )}

                {(isInPool && isRainbow(name)) && (
                  <button onClick={(e) => { e.stopPropagation(); toggleBan(name) }}
                    className={`absolute text-xs px-1 rounded/ ${isBanned ? 'top-1 right-1 bg-red-700' : ' bottom-7 left-11 bg-gray-700 hover:bg-red-700'}`}>
                    {isBanned ? '✕' : 'BAN'}
                  </button>
                )}
                
                {(isInPool && isRainbow(name) == false) && (
                  <button onClick={(e) => { e.stopPropagation(); toggleBan(name) }}
                    className={`absolute top-1 right-1 text-xs px-1 rounded/ ${isBanned ? 'bg-red-700' : ' bg-gray-700 hover:bg-red-700'}`}>
                    {isBanned ? '✕' : 'BAN'}
                  </button>
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

                <div className="relative group/opgg flex items-center gap-1 justify-center">
                  <p
                    onClick={(e) => { if (!isInPool) return; e.stopPropagation(); window.open(`https://www.op.gg/champions/${championMap[name]?.toLowerCase()}/build`, '_blank') }}
                    className={`text-xs text-center font-bold leading-tight transition-colors ${isInPool ? 'text-yellow-400 cursor-pointer hover:text-yellow-300' : 'text-gray-300 cursor-default'}`}>
                    {name}
                  </p>
                  {isInPool && (
                    <svg onClick={(e) => { e.stopPropagation(); window.open(`https://www.op.gg/champions/${championMap[name]?.toLowerCase()}/build`, '_blank') }}
                      xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-gray-500 cursor-pointer hover:text-yellow-300 flex-shrink-0">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  )}
                  {isInPool && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/opgg:opacity-100 transition-opacity z-10 pointer-events-none">
                      このチャンピオンをOP.GGで確認する
                    </div> 
                  )}
                </div>

                {champLanes.length > 0 && (
                  <div className="relative group/lane">
                    <p onClick={() => isInPool ? openEdit(pickInfo!) : undefined}
                      className={`text-xs text-gray-400 transition-colors ${isInPool ? 'cursor-pointer hover:text-gray-200' : ''}`}>
                      {champLanes.join(' / ')}
                    </p>
                    {isInPool && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/lane:opacity-100 transition-opacity z-10 pointer-events-none">
                        このチャンピオンのロール・タグを編集します
                      </div>
                    )}
                  </div>
                )}

                <div className="relative group/tag">
                  <button onClick={(e) => { if (!isInPool) return; e.stopPropagation(); openEdit(pickInfo!) }}
                    className={`text-xs px-1 rounded flex flex-wrap gap-1 justify-center max-w-full transition-colors ${isInPool ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default'}`}>
                    {champTags.length > 0
                      ? champTags.map(tag => <span key={tag} className="bg-purple-900 text-purple-300 px-1 rounded">{tag}</span>)
                      : <span className="text-gray-500">タグなし</span>}
                  </button>
                  {isInPool && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/tag:opacity-100 transition-opacity z-10 pointer-events-none">
                      このチャンピオンのロール・タグを編集します
                    </div>
                  )}
                </div>

                <div className="relative group/matchup">
                  <button onClick={(e) => { if (!isInPool) return; e.stopPropagation(); openMatchup(name) }}
                    className={`flex gap-1 text-xs rounded px-1 transition-colors ${isInPool ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default'}`}>
                    {mu?.favorable.length > 0
                      ? <span className="text-green-400">▲{mu.favorable.length}</span>
                      : <span className="text-green-400 opacity-30">▲0</span>}
                    {mu?.unfavorable.length > 0
                      ? <span className="text-red-400">▼{mu.unfavorable.length}</span>
                      : <span className="text-red-400 opacity-30">▼0</span>}
                  </button>
                  {isInPool && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/matchup:opacity-100 transition-opacity z-10 pointer-events-none">
                      このチャンピオンの対面を設定します
                    </div>
                  )}
                </div>
                {viewMode === 'mastery' && masteryData[name] && (
                  <p className="text-xs text-gray-500">{(masteryData[name] / 10000).toFixed(0)}万pts</p>
                )}

                {/* 記録・対策ビルド */}
                <div className="flex gap-1 mt-1 flex-wrap justify-center">
                  {isInPool && (
                    <div className="relative group/record">
                      <button
                        onClick={() => {
                          const active = enemyChamps.filter(e => !bannedChamps.has(e))
                          if (active.length === 0) return
                          setResultForm({ myChamp: name, enemyChamp: active.length === 1 ? active[0] : '', enemySearch: '' })
                          setShowResultForm(true)
                        }}
                        className={`text-xs px-1 rounded transition-all ${enemyChamps.filter(e => !bannedChamps.has(e)).length > 0 ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 opacity-40 cursor-default'}`}>
                        記録
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/record:opacity-100 transition-opacity z-10 pointer-events-none">
                        {enemyChamps.filter(e => !bannedChamps.has(e)).length === 0 ? '相手チャンプを設定してください' : '戦績を入力します'}
                      </div>
                    </div>
                  )}
                  {isInPool && (
                    <div className="relative group/build">
                      <button
                        onClick={() => {
                          const active = enemyChamps.filter(e => !bannedChamps.has(e))
                          if (active.length === 0) return
                          if (active.length === 1) {
                            window.open(`https://lolalytics.com/ja/lol/${championMap[name]?.toLowerCase()}/vs/${championMap[active[0]]?.toLowerCase()}/build/`, '_blank')
                          } else {
                            setLolalyticsChamp(name)
                            setShowLolalyticsModal(true)
                          }
                        }}
                        className={`text-xs px-1 rounded transition-all ${enemyChamps.filter(e => !bannedChamps.has(e)).length > 0 ? 'bg-teal-700 hover:bg-teal-600' : 'bg-gray-700 opacity-40 cursor-default'}`}>
                        対策ビルド
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover/build:opacity-100 transition-opacity z-10 pointer-events-none">
                        {enemyChamps.filter(e => !bannedChamps.has(e)).length === 0 ? '相手チャンプを設定してください' : 'LolalyticsでVSページに飛ぶ'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {/* ユーザー名設定モーダル */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">ユーザー名を設定</h2>
              <p className="text-sm text-gray-400 mb-4">他のユーザーがあなたのピックプールを閲覧できるURLになります</p>
              <input type="text" placeholder="ユーザー名..." value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveUsername()}
                className="w-full p-2 mb-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
              {usernameError && <p className="text-red-400 text-sm mb-2">{usernameError}</p>}
              <div className="flex gap-3">
                <button onClick={saveUsername} className="flex-1 p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">保存</button>
                <button onClick={() => { setShowUsernameModal(false); setUsernameError('') }}
                  className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600">キャンセル</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 相手チャンプピッカー */}
      {showEnemyPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-red-400">相手チャンプを選択</h2>
            <input type="text" placeholder="検索..." value={enemySearch}
              onChange={e => setEnemySearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-red-400" />
            <div className="flex gap-2 flex-wrap mb-2">
              {LANES.map(l => (
                <button key={l} onClick={() => setEnemyLane(l)}
                  className={`px-2 py-1 rounded text-xs font-bold ${enemyLane === l ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              <button onClick={() => setEnemyTag('全て')}
                className={`px-2 py-1 rounded text-xs font-bold ${enemyTag === '全て' ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                全て
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setEnemyTag(tag)}
                  className={`px-2 py-1 rounded text-xs font-bold ${enemyTag === tag ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto mb-4">
              {allChampions.filter(n => {
                if (enemySearch !== '' && !n.includes(enemySearch)) return false
                if (enemyLane !== '全て') {
                  const lanes = getChampionLanes(n)
                  if (lanes.length > 0 && !lanes.includes(enemyLane)) return false
                }
                if (enemyTag !== '全て') {
                  if (!getChampionTags(n).includes(enemyTag)) return false
                }
                return true
              }).map(name => {
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
            <button onClick={() => { setShowEnemyPicker(false); setEnemySearch(''); setEnemyLane('全て'); setEnemyTag('全て') }}
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
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-gray-400">あなたのチャンピオン理解度: {form.priority}</p>
                <div className="relative group">
                  <span className="text-xs text-gray-500 bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center cursor-default">?</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded w-48 text-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    理解度が高ければ高いほどカウンターピックで表示する際に、優先的に並べられます
                  </div>
                </div>
              </div>
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

            {/* 一括設定モードボタン */}
            <div className="flex gap-2 mb-4">
              <span className="text-sm text-gray-400 self-center">一括設定:</span>
              {(['favorable', 'unfavorable', 'skill', 'none'] as const).map(type => (
                <button key={type} onClick={() => setBulkMatchupMode(prev => prev === type ? null : type)}
                  className={`px-3 py-1 rounded text-sm font-bold border-2 transition-all
                    ${bulkMatchupMode === type
                      ? type === 'favorable' ? 'bg-green-700 border-green-400 text-white'
                        : type === 'unfavorable' ? 'bg-red-700 border-red-400 text-white'
                        : type === 'skill' ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-gray-600 border-gray-400 text-white'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                  {type === 'favorable' ? '▲ 有利' : type === 'unfavorable' ? '▼ 不利' : type === 'skill' ? '● スキル' : '✕ 解除'}
                </button>
              ))}
              {bulkMatchupMode && <span className="text-xs text-gray-400 self-center">クリックで一括設定中</span>}
            </div>

            {/* 検索 */}
            <input type="text" placeholder="検索..." value={favorableSearch}
              onChange={e => setFavorableSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />

            {/* チャンピオン一覧 */}
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-4">
              {allChampions.filter(n => n !== selectedChamp && (favorableSearch === '' || n.includes(favorableSearch))).map(name => {
                const favorable = matchupInput.favorable.split(',').map(s => s.trim()).filter(Boolean)
                const unfavorable = matchupInput.unfavorable.split(',').map(s => s.trim()).filter(Boolean)
                const isFavorable = favorable.includes(name)
                const isUnfavorable = unfavorable.includes(name)
                const isSkill = isFavorable && isUnfavorable
                const isSelected = selectedMatchupChamp === name

                const borderColor = isSkill ? 'border-yellow-400 bg-yellow-950'
                  : isFavorable ? 'border-green-400 bg-green-950'
                  : isUnfavorable ? 'border-red-400 bg-red-950'
                  : isSelected ? 'border-white bg-gray-600'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-400'

                return (
                  <button key={name} onClick={() => handleMatchupChampClick(name)}
                    className={`text-xs p-1 rounded flex flex-col items-center gap-1 border-2 transition-all ${borderColor}`}>
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-8 h-8 rounded-full" />}
                    <span className="truncate w-full text-center leading-tight">
                      {isSkill ? '● ' : isFavorable ? '▲ ' : isUnfavorable ? '▼ ' : ''}{name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 選択中チャンプへの設定ボタン */}
            {selectedMatchupChamp && (
              <div className="bg-gray-700 rounded p-3 mb-4">
                <p className="text-sm text-gray-300 mb-2"><span className="text-white font-bold">{selectedMatchupChamp}</span> を設定:</p>
                <div className="flex gap-2">
                  {(['favorable', 'unfavorable', 'skill', 'none'] as const).map(type => (
                    <button key={type} onClick={() => setMatchupType(selectedMatchupChamp, type)}
                      className={`flex-1 py-2 rounded font-bold text-sm border-2 transition-all
                        ${type === 'favorable' ? 'bg-green-800 border-green-400 hover:bg-green-700'
                          : type === 'unfavorable' ? 'bg-red-800 border-red-400 hover:bg-red-700'
                          : type === 'skill' ? 'bg-yellow-800 border-yellow-400 hover:bg-yellow-700'
                          : 'bg-gray-600 border-gray-500 hover:bg-gray-500'}`}>
                      {type === 'favorable' ? '▲ 有利' : type === 'unfavorable' ? '▼ 不利' : type === 'skill' ? '● スキル' : '✕ 解除'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => saveMatchup(selectedChamp)} className="flex-1 p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">保存</button>
              <button onClick={() => { setSelectedChamp(null); setFavorableSearch(''); setSelectedMatchupChamp(null); setBulkMatchupMode(null) }}
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
                  className="flex items-center justify-between bg-gray-700 hover:bg-gray-600 p-3 rounded transition-all">
                  <span className="font-bold text-white">{u.username}</span>
                  <span className="text-gray-400 text-sm">閲覧 →</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setShowUserList(false); setUserListSearch('') }}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600">閉じる</button>
          </div>
        </div>
      )}
      {/* Lolalytics対面選択モーダル */}
      {showLolalyticsModal && lolalyticsChamp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-teal-400">
              {lolalyticsChamp} の対面を選択
            </h2>
            <div className="grid gap-2 max-h-72 overflow-y-auto mb-4">
              {enemyChamps.map(enemy => (
                <button key={enemy} onClick={() => {
                  window.open(`https://lolalytics.com/ja/lol/${championMap[lolalyticsChamp]?.toLowerCase()}/vs/${championMap[enemy]?.toLowerCase()}/build/`, '_blank')
                  setShowLolalyticsModal(false)
                }}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 p-3 rounded transition-all">
                  {getChampionIcon(enemy) && <img src={getChampionIcon(enemy)} alt={enemy} className="w-6 h-6 rounded-full" />}
                  <span className="font-bold text-white">vs {enemy}</span>
                  <span className="text-gray-400 text-sm ml-auto">開く →</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowLolalyticsModal(false)}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600">閉じる</button>
          </div>
        </div>
      )}
      {/* RiotID設定モーダル */}
      {showRiotIdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2 text-orange-400">RiotIDを設定</h2>
            <p className="text-sm text-gray-400 mb-4">例: Haru / JP1</p>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" placeholder="サモナーネーム"
                value={newRiotIdName}
                onChange={e => setNewRiotIdName(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-orange-400" />
              <span className="text-gray-400 font-bold">#</span>
              <input type="text" placeholder="タグライン"
                value={newRiotIdTag}
                onChange={e => setNewRiotIdTag(e.target.value)}
                className="w-24 p-2 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-orange-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                if (!newRiotIdName.trim() || !newRiotIdTag.trim()) return
                const combined = `${newRiotIdName.trim()}#${newRiotIdTag.trim()}`
                saveRiotId(combined)
              }} className="flex-1 p-2 bg-orange-400 text-gray-900 font-bold rounded hover:bg-orange-300">保存</button>
              <button onClick={() => setShowRiotIdModal(false)}
                className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600">キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {/* スコア詳細モーダル */}
      {showScoreDetail && (() => {
        const mu = matchups[showScoreDetail]
        const activeEnemies = enemyChamps.filter(e => !bannedChamps.has(e))
        const bannedEnemies = enemyChamps.filter(e => bannedChamps.has(e))
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
                    <span className={`text-sm font-bold ${currentScore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      現在: {currentScore > 0 ? `+${currentScore}` : currentScore}
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