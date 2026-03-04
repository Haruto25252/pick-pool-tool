import { NextRequest, NextResponse } from 'next/server'
import { getChampionIdMap } from '@/lib/champions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const riotId = searchParams.get('riotId')
  if (!riotId) return NextResponse.json({ error: 'riotId required' }, { status: 400 })

  const apiKey = process.env.RIOT_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  try {
    const [gameName, tagLine] = riotId.split('#')

    // PUUID取得
    const accountRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { 'X-Riot-Token': apiKey } }
    )
    if (!accountRes.ok) return NextResponse.json({ error: 'RiotID not found' }, { status: 404 })
    const account = await accountRes.json()

    // マスタリー取得
    const masteryRes = await fetch(
      `https://jp1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}/top?count=50`,
      { headers: { 'X-Riot-Token': apiKey } }
    )
    if (!masteryRes.ok) return NextResponse.json({ error: 'Mastery fetch failed' }, { status: 500 })
    const mastery = await masteryRes.json()

    // championId→英語名のマップを作成
    const idMap = await getChampionIdMap()
    const idToEnglish: Record<number, string> = {}
    Object.entries(idMap).forEach(([eng, id]) => { idToEnglish[id] = eng })

    // 日本語名→ポイントのマップに変換
    const jaMap: Record<string, number> = {}
    const jaNames = Object.fromEntries(
      Object.entries(await import('@/lib/champions').then(m => m.championMap)).map(([ja, en]) => [en, ja])
    )
    mastery.forEach((m: { championId: number, championPoints: number }) => {
      const engName = idToEnglish[m.championId]
      if (engName) {
        const jaName = jaNames[engName]
        if (jaName) jaMap[jaName] = m.championPoints
      }
    })

    return NextResponse.json({ mastery: jaMap })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}