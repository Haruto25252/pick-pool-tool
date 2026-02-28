import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uxinvinstjlhkkhrmrdx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aW52aW5zdGpsaGtraHJtcmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTE3NTEsImV4cCI6MjA4Nzc2Nzc1MX0.bqUN22wS761LnqD7duV0Lw4hmJFs-2w3l6h0FAJ9Qvg'
const ADMIN_EMAIL = 'haruhiro.u@icloud.com'
const ADMIN_PASSWORD = 'Urabeharuhiro0502'

const TAG_MAP = {
  'Fighter': 'ファイター',
  'Tank': 'タンク',
  'Mage': 'マジシャン',
  'Assassin': 'アサシン',
  'Marksman': 'マークスマン',
  'Support': 'サポート',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD
})
if (signInError) { console.error('ログイン失敗:', signInError); process.exit(1) }
console.log('ログイン成功:', user.id)

const res = await fetch('https://ddragon.leagueoflegends.com/cdn/16.4.1/data/ja_JP/champion.json')
const json = await res.json()
const champions = Object.values(json.data)

console.log(`${champions.length}体のチャンピオン情報を取得`)

for (const champ of champions) {
  const name = champ.name
  const tags = champ.tags.map(t => TAG_MAP[t]).filter(Boolean)
  
  const { error } = await supabase.from('champion_config')
    .upsert({ user_id: user.id, champion_name: name, tags, lanes: [] }, { onConflict: 'user_id,champion_name' })
  
  if (error) console.error(`${name} エラー:`, error.message)
  else console.log(`${name}: ${tags.join(', ')}`)
}

console.log('完了!')