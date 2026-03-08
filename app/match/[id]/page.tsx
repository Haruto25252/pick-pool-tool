'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { getChampionIcon, championMap } from '@/lib/champions'
import { Tooltip } from '@/components/Tooltip'
import { useLanguage } from '@/components/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { getTagDisplayName } from '@/lib/i18n'

type MatchSession = {
  id: string
  name: string
  created_by: string
  bans: string[]
  team1_picks: string[]
  team2_picks: string[]
  team1_users: string[]
  team2_users: string[]
  team1_lanes: Record<string, string>
  team2_lanes: Record<string, string>
}

type PickPool = {
  id: string
  champion_name: string
  lane: string[]
  priority: number
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

type Profile = {
  id: string
  username: string
  riot_id: string | null
}

type UserPickPool = {
  username: string
  champions: { name: string; priority: number; lanes: string[] }[]
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { lang, t } = useLanguage()

  const [match, setMatch] = useState<MatchSession | null>(null)
  const [myTeam, setMyTeam] = useState<'team1' | 'team2'>('team1')
  const [userId, setUserId] = useState<string | null>(null)
  const [showChampPicker, setShowChampPicker] = useState<'ban' | 'team1' | 'team2' | null>(null)
  const [showUserPicker, setShowUserPicker] = useState<'team1' | 'team2' | null>(null)
  const [champSearch, setChampSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [pickPool, setPickPool] = useState<PickPool[]>([])
  const [matchups, setMatchups] = useState<Record<string, Matchup>>({})
  const [championConfigs, setChampionConfigs] = useState<Record<string, ChampionConfig>>({})
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [teamPickPools, setTeamPickPools] = useState<Record<string, UserPickPool>>({})
  const [showBanSuggest, setShowBanSuggest] = useState(false)
  const [showLanePicker, setShowLanePicker] = useState<{team: 'team1' | 'team2', username: string} | null>(null)
  const [showScoreDetail, setShowScoreDetail] = useState<string | null>(null)

  const allChampions = Object.keys(championMap)

  const getDisplayName = (jaName: string) => lang === 'en' ? (championMap[jaName] || jaName) : jaName

  const matchesSearch = (name: string, query: string) => {
    if (query === '') return true
    if (lang === 'en') {
      return name.toLowerCase().includes(query.toLowerCase()) ||
        (championMap[name] || '').toLowerCase().includes(query.toLowerCase())
    }
    return name.includes(query)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const [{ data: pool }, { data: mu }, { data: defaultMu }, { data: configs }, { data: defaultConfigs }, { data: profiles }] = await Promise.all([
          supabase.from('pick_pool').select('*').eq('user_id', user.id).order('priority', { ascending: false }),
          supabase.from('matchup').select('*').eq('user_id', user.id),
          supabase.from('default_matchup').select('*'),
          supabase.from('champion_config').select('*').eq('user_id', user.id),
          supabase.from('default_champion_config').select('*'),
          supabase.from('profile').select('id, username, riot_id').order('username')
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
        if (profiles) setAllProfiles(profiles)
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

  useEffect(() => {
    if (!match) return
    fetchTeamPickPools()
  }, [match?.team1_users, match?.team2_users])

  const fetchMatch = async () => {
    const { data } = await supabase.from('match_session').select('*').eq('id', id).single()
    if (data) setMatch(data)
  }

  const fetchTeamPickPools = async () => {
    if (!match) return
    const allUsers = [...(match.team1_users || []), ...(match.team2_users || [])]
    if (allUsers.length === 0) return

    const newPools: Record<string, UserPickPool> = {}
    for (const username of allUsers) {
      const profile = allProfiles.find(p => p.username === username)
      if (!profile) continue
      const [{ data: pool }, { data: configs }] = await Promise.all([
        supabase.from('pick_pool').select('champion_name, priority, lane').eq('user_id', profile.id),
        supabase.from('champion_config').select('champion_name, lanes').eq('user_id', profile.id)
      ])
      if (pool) {
        const configMap: Record<string, string[]> = {}
        if (configs) configs.forEach((c: any) => { configMap[c.champion_name] = c.lanes })
        newPools[username] = {
          username,
          champions: pool.map(p => ({
            name: p.champion_name,
            priority: p.priority,
            lanes: p.lane || configMap[p.champion_name] || []
          }))
        }
      }
    }
    setTeamPickPools(newPools)
  }

  const toggleBan = async (name: string) => {
    if (!match) return
    const newBans = match.bans.includes(name) ? match.bans.filter(n => n !== name) : [...match.bans, name]
    setMatch({ ...match, bans: newBans })
    await supabase.from('match_session').update({ bans: newBans }).eq('id', id)
  }

  const togglePick = async (name: string, team: 'team1' | 'team2') => {
    if (!match) return
    const key = `${team}_picks` as 'team1_picks' | 'team2_picks'
    const current = match[key]
    const newPicks = current.includes(name) ? current.filter(n => n !== name) : [...current, name]
    setMatch({ ...match, [key]: newPicks })
    await supabase.from('match_session').update({ [key]: newPicks }).eq('id', id)
  }

  const toggleUser = async (username: string, team: 'team1' | 'team2') => {
    if (!match) return
    const key = `${team}_users` as 'team1_users' | 'team2_users'
    const current = match[key] || []
    const newUsers = current.includes(username) ? current.filter(n => n !== username) : [...current, username]
    setMatch({ ...match, [key]: newUsers })
    await supabase.from('match_session').update({ [key]: newUsers }).eq('id', id)
  }

  const resetMatch = async () => {
    if (!confirm(t('matchDetail.resetConfirm'))) return
    const reset = { bans: [], team1_picks: [], team2_picks: [], team1_users: [], team2_users: [] }
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

  const setUserLane = async (username: string, team: 'team1' | 'team2', lane: string) => {
    if (!match) return
    const key = `${team}_lanes` as 'team1_lanes' | 'team2_lanes'
    const current = match[key] || {}
    const newLanes = { ...current, [username]: lane }
    setMatch({ ...match, [key]: newLanes })
    await supabase.from('match_session').update({ [key]: newLanes }).eq('id', id)
    setShowLanePicker(null)
  }

  // BANおすすめ計算
  const getBanSuggestions = () => {
    if (!match) return []
    const enemyTeamKey = myTeam === 'team1' ? 'team2' : 'team1'
    const enemyUsers = match[`${enemyTeamKey}_users`] || []
    const enemyLanes = match[`${enemyTeamKey}_lanes`] || {}

    const champScores: Record<string, number> = {}

    for (const username of enemyUsers) {
      const pool = teamPickPools[username]
      if (!pool) continue
      const assignedLane = enemyLanes[username]

      for (const { name, priority, lanes } of pool.champions) {
        if (assignedLane && assignedLane !== '全て' && lanes.length > 0 && !lanes.includes(assignedLane)) continue
        if (!champScores[name]) champScores[name] = 0
        champScores[name] += priority
      }
    }

    return Object.entries(champScores)
      .filter(([name]) => !match.bans.includes(name))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, score]) => ({ name, score }))
  }

  // OP.GGマルチサーチURL生成
  const getMultiSearchUrl = (team: 'team1' | 'team2') => {
    if (!match) return null
    const users = match[`${team}_users`] || []
    const riotIds = users
      .map(username => allProfiles.find(p => p.username === username)?.riot_id)
      .filter(Boolean) as string[]
    if (riotIds.length === 0) return null
    const query = riotIds.map(r => encodeURIComponent(r.replace('#', '#'))).join(',')
    return `https://www.op.gg/ja/lol/multisearch/jp?summoners=${query}`
  }

  if (!match) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p className="text-gray-400">{t('loading')}</p>
    </div>
  )

  if (!myTeam) (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-yellow-400 mb-2">{match.name}</h1>
        <p className="text-gray-400 mb-6">{lang === 'ja' ? '参加するチームを選択してください' : 'Select your team'}</p>
        <div className="grid gap-3">
          <button onClick={() => setMyTeam('team1')} className="p-4 bg-blue-700 hover:bg-blue-600 rounded-lg font-bold text-lg">{t('matchDetail.team1')}</button>
          <button onClick={() => setMyTeam('team2')} className="p-4 bg-red-700 hover:bg-red-600 rounded-lg font-bold text-lg">{t('matchDetail.team2')}</button>
        </div>
        <button onClick={() => router.push('/match')} className="mt-4 w-full p-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">{t('back')}</button>
      </div>
    </div>
  )

  const enemyTeam = myTeam === 'team1' ? 'team2' : 'team1'
  const enemyChamps = match[`${enemyTeam}_picks`]
  const allPicked = [...match.team1_picks, ...match.team2_picks, ...match.bans]
  const banSuggestions = getBanSuggestions()

  const sortedPool = Array.from(new Set(pickPool.map(p => p.champion_name))).sort((a, b) => {    const sa = getCounterScore(a, enemyChamps)
    const sb = getCounterScore(b, enemyChamps)
    const aSkill = enemyChamps.some(e => matchups[a]?.favorable.includes(e)) && enemyChamps.some(e => matchups[a]?.unfavorable.includes(e))
    const bSkill = enemyChamps.some(e => matchups[b]?.favorable.includes(e)) && enemyChamps.some(e => matchups[b]?.unfavorable.includes(e))
    if (enemyChamps.length > 0) {
      const aGroup = sa > 0 ? 0 : aSkill ? 1 : sa === 0 ? 2 : 3
      const bGroup = sb > 0 ? 0 : bSkill ? 1 : sb === 0 ? 2 : 3
      if (aGroup !== bGroup) return aGroup - bGroup
    }
    if (sb !== sa) return sb - sa
    return (getPickInfo(b)?.priority ?? 0) - (getPickInfo(a)?.priority ?? 0)
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-yellow-400">{match.name}</h1>
            <p className="text-sm text-gray-400">{myTeam === 'team1' ? t('matchDetail.team1') : t('matchDetail.team2')} {t('matchDetail.joinAs')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <LanguageSwitcher />
            <button onClick={() => setMyTeam(prev => prev === 'team1' ? 'team2' : 'team1')}
              className="px-3 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm">
              {t('matchDetail.changeTeam')}{myTeam === 'team1' ? t('matchDetail.team1') : t('matchDetail.team2')}）
            </button>
            {userId === match.created_by && (
              <button onClick={resetMatch}
                className="px-3 py-2 bg-orange-600 rounded hover:bg-orange-500 text-sm font-bold">
                {t('matchDetail.reset')}
              </button>
            )}
            <button onClick={() => router.push('/match')}
              className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm">
              {t('back')}
            </button>
          </div>
        </div>

        {/* BAN */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="font-bold text-red-400">{t('matchDetail.ban')} ({match.bans.length})</span>
            <div className="flex gap-2">
              {banSuggestions.length > 0 && (
                <button onClick={() => setShowBanSuggest(!showBanSuggest)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-bold">
                  {t('matchDetail.banSuggest')}
                </button>
              )}
              <button onClick={() => setShowChampPicker('ban')} className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm">{t('matchDetail.banAdd')}</button>
            </div>
          </div>
          {showBanSuggest && (
            <div className="mb-3 p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-yellow-400 font-bold mb-2">{t('matchDetail.banSuggest.title')}</p>
              <div className="flex flex-wrap gap-2">
                {banSuggestions.map(({ name, score }) => (
                  <button key={name} onClick={() => toggleBan(name)}
                    className="flex items-center gap-1 bg-gray-600 hover:bg-red-900 border border-gray-500 hover:border-red-400 px-2 py-1 rounded text-sm transition-all">
                    {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                    <span>{getDisplayName(name)}</span>
                    <span className="text-yellow-400 text-xs ml-1">({score})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {match.bans.length === 0 && <p className="text-gray-500 text-sm">{t('matchDetail.banNone')}</p>}
            {match.bans.map(name => (
              <button key={name} onClick={() => toggleBan(name)}
                className="flex items-center gap-1 bg-red-900 border border-red-500 px-2 py-1 rounded text-sm hover:bg-red-800">
                {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full opacity-50" />}
                <span className="line-through text-red-300">{getDisplayName(name)}</span>
                <span className="text-red-300 ml-1">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* チーム */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {(['team1', 'team2'] as const).map(team => {
            const multiSearchUrl = getMultiSearchUrl(team)
            return (
              <div key={team} className={`bg-gray-800 rounded-lg p-4 border-2 ${team === 'team1' ? 'border-blue-700' : 'border-red-700'}`}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <Tooltip text={team === 'team1' ? t('matchDetail.joinTeam1') : t('matchDetail.joinTeam2')} align="left">
                    <span className={`font-bold cursor-pointer ${team === 'team1' ? 'text-blue-400 hover:text-blue-300' : 'text-red-400 hover:text-red-300'}`}
                      onClick={() => setMyTeam(team)}>
                      {team === 'team1' ? t('matchDetail.team1') : t('matchDetail.team2')}
                      {myTeam === team && <span className="text-xs ml-1 text-gray-400">{t('matchDetail.participating')}</span>}
                    </span>
                  </Tooltip>
                  <div className="flex gap-1">
                    {multiSearchUrl && (
                      <Tooltip text={t('matchDetail.opgg.tooltip')}>
                        <button onClick={() => window.open(multiSearchUrl, '_blank')}
                          className="px-2 py-1 bg-orange-700 hover:bg-orange-600 rounded text-xs font-bold">
                          OP.GG
                        </button>
                      </Tooltip>
                    )}
                    <button onClick={() => setShowUserPicker(team)}
                      className={`px-2 py-1 rounded text-xs ${team === 'team1' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-red-700 hover:bg-red-600'}`}>
                      {t('matchDetail.member')}
                    </button>
                    <button onClick={() => setShowChampPicker(team)}
                      className={`px-2 py-1 rounded text-xs ${team === 'team1' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-red-700 hover:bg-red-600'}`}>
                      {t('matchDetail.pick')}
                    </button>
                  </div>
                </div>
                {/* メンバー表示 */}
                {(match[`${team}_users`] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(match[`${team}_users`] || []).map(username => {
                      const lane = (match[`${team}_lanes`] || {})[username]
                      return (
                        <button key={username} onClick={() => setShowLanePicker({team, username})}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${team === 'team1' ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-red-900 text-red-300 hover:bg-red-800'}`}>
                          👤 {username}
                          {lane ? <span className="text-yellow-400 font-bold">{lane}</span> : <span className="text-gray-500">{t('matchDetail.laneNone')}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* ピック表示 */}
                <div className="flex flex-wrap gap-2">
                  {match[`${team}_picks`].length === 0 && <p className="text-gray-500 text-sm">{t('matchDetail.pickNone')}</p>}
                  {match[`${team}_picks`].map(name => (
                    <button key={name} onClick={() => togglePick(name, team)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm border
                        ${team === 'team1' ? 'bg-blue-900 border-blue-500 hover:bg-blue-800' : 'bg-red-900 border-red-500 hover:bg-red-800'}`}>
                      {getChampionIcon(name) && <img src={getChampionIcon(name)} alt={name} className="w-5 h-5 rounded-full" />}
                      {getDisplayName(name)}<span className="ml-1 opacity-50">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ピックプール */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-bold text-yellow-400 mb-3">
            {t('matchDetail.myPool')}
            {enemyChamps.length > 0 && <span className="text-sm text-gray-400 ml-2">{t('matchDetail.enemies')}{enemyChamps.map(n => getDisplayName(n)).join(', ')}）</span>}
          </h2>
          {sortedPool.length === 0 && <p className="text-gray-500 text-sm">{t('matchDetail.poolEmpty')}</p>}
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
                  {enemyChamps.length > 0 && (
                    <button onClick={() => setShowScoreDetail(name)}
                      className={`absolute top-1 left-1 text-xs font-bold px-1 rounded hover:bg-gray-700 transition-all ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {score > 0 ? `+${score}` : score === 0 ? '±0' : score}
                    </button>
                  )}
                  {getChampionIcon(name)
                    ? <img src={getChampionIcon(name)} alt={name} className="w-10 h-10 rounded-full" />
                    : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">{getDisplayName(name)}</div>
                  }
                  <p className="text-xs text-center font-bold leading-tight text-yellow-400">{getDisplayName(name)}</p>
                  {champTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {champTags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-purple-900 text-purple-300 px-1 rounded">{getTagDisplayName(tag, lang)}</span>
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
              {showChampPicker === 'ban' ? t('matchDetail.selectBan')
                : showChampPicker === 'team1' ? t('matchDetail.selectTeam1')
                : t('matchDetail.selectTeam2')}
            </h2>
            <input type="text" placeholder={t('search')} value={champSearch}
              onChange={e => setChampSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto mb-4">
              {allChampions.filter(n => matchesSearch(n, champSearch)).map(name => {
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
                    <span className="truncate">{getDisplayName(name)}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setShowChampPicker(null); setChampSearch('') }}
              className="w-full p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">{t('done')}</button>
          </div>
        </div>
      )}

      {/* ユーザーピッカー */}
      {showUserPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              {showUserPicker === 'team1' ? t('matchDetail.team1') : t('matchDetail.team2')} {t('matchDetail.selectMember')}
            </h2>
            <input type="text" placeholder={t('search')} value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-gray-700 focus:outline-none border border-gray-600 focus:border-yellow-400" />
            <div className="grid gap-2 max-h-80 overflow-y-auto mb-4">
              {allProfiles.filter(p => userSearch === '' || p.username.includes(userSearch)).map(profile => {
                const isSelected = (match[`${showUserPicker}_users`] || []).includes(profile.username)
                const isOtherTeam = (match[showUserPicker === 'team1' ? 'team2_users' : 'team1_users'] || []).includes(profile.username)
                return (
                  <button key={profile.id} onClick={() => !isOtherTeam && toggleUser(profile.username, showUserPicker)}
                    disabled={isOtherTeam}
                    className={`flex items-center justify-between p-3 rounded transition-all border
                      ${isOtherTeam ? 'opacity-30 border-gray-700 bg-gray-700 cursor-not-allowed'
                        : isSelected ? 'border-yellow-400 bg-yellow-900'
                        : 'border-gray-600 bg-gray-700 hover:border-yellow-400'}`}>
                    <div>
                      <span className="font-bold text-white">{profile.username}</span>
                      {profile.riot_id && <span className="text-xs text-gray-400 ml-2">{profile.riot_id}</span>}
                    </div>
                    {isSelected && <span className="text-yellow-400">✓</span>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setShowUserPicker(null); setUserSearch('') }}
              className="w-full p-2 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-300">{t('done')}</button>
          </div>
        </div>
      )}
      {/* レーン選択モーダル */}
      {showLanePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-xs">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">
              {showLanePicker.username} {t('matchDetail.laneSet')}
            </h2>
            <div className="grid gap-2">
              {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map(lane => (
                <button key={lane} onClick={() => setUserLane(showLanePicker.username, showLanePicker.team, lane)}
                  className="p-3 bg-gray-700 hover:bg-yellow-600 rounded font-bold transition-all">
                  {lane}
                </button>
              ))}
              <button onClick={() => setUserLane(showLanePicker.username, showLanePicker.team, '全て')}
                className="p-3 bg-gray-600 hover:bg-gray-500 rounded text-gray-400 transition-all">
                {t('matchDetail.laneNone')}
              </button>
            </div>
            <button onClick={() => setShowLanePicker(null)}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-3">{t('cancel')}</button>
          </div>
        </div>
      )}
      {showScoreDetail && (() => {
      const mu = matchups[showScoreDetail]
      const currentScore = getCounterScore(showScoreDetail, enemyChamps)

      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              {getChampionIcon(showScoreDetail) && <img src={getChampionIcon(showScoreDetail)} alt={showScoreDetail} className="w-10 h-10 rounded-full" />}
              <div>
                <h2 className="text-lg font-bold text-white">{getDisplayName(showScoreDetail)}</h2>
                <span className={`text-sm font-bold ${currentScore > 0 ? 'text-green-400' : currentScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {t('matchDetail.score.current')}{currentScore > 0 ? `+${currentScore}` : currentScore === 0 ? t('matchDetail.score.neutral') : currentScore}
                </span>
              </div>
            </div>
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {enemyChamps.map(enemy => {
                const isFavorable = mu?.favorable.includes(enemy)
                const isUnfavorable = mu?.unfavorable.includes(enemy)
                const isSkill = isFavorable && isUnfavorable
                return (
                  <div key={enemy} className={`flex items-center justify-between p-2 rounded border
                    ${isSkill ? 'border-yellow-400 bg-yellow-950'
                      : isFavorable ? 'border-green-400 bg-green-950'
                      : isUnfavorable ? 'border-red-500 bg-red-950'
                      : 'border-gray-600 bg-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      {getChampionIcon(enemy) && <img src={getChampionIcon(enemy)} alt={enemy} className="w-7 h-7 rounded-full" />}
                      <span className="text-sm font-bold text-white">{getDisplayName(enemy)}</span>
                    </div>
                    <span className={`text-xs font-bold ${isSkill ? 'text-yellow-400' : isFavorable ? 'text-green-400' : isUnfavorable ? 'text-red-400' : 'text-gray-500'}`}>
                      {isSkill ? t('matchup.skill') : isFavorable ? t('matchup.favorable') : isUnfavorable ? t('matchup.unfavorable') : t('matchup.neutral')}
                    </span>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowScoreDetail(null)}
              className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 mt-4">{t('close')}</button>
          </div>
        </div>
      )
    })()}
    </div>
  )
}
