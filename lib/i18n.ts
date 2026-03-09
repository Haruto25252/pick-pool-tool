export type Lang = 'ja' | 'en'

export const translations: Record<Lang, Record<string, string>> = {
  ja: {
    // Common
    'close': '閉じる',
    'save': '保存',
    'cancel': 'キャンセル',
    'delete': '削除',
    'add': '追加',
    'search': '検索...',
    'all': '全て',
    'loading': '読み込み中...',
    'done': '完了',
    'back': '← 戻る',
    'none': 'なし',

    // Language switcher
    'language.change': '言語を変更する',
    'language.changeToJa': '日本語に変更',
    'language.changeToEn': '英語に変更',

    // Header (main page)
    'header.opgg.tooltip': 'あなたのプロフィールを開きます',
    'header.riotid.set': 'RiotID設定',
    'header.riotid.change.tooltip': 'RiotIDを変更します',
    'header.username.set': 'ユーザー名を設定',
    'header.username.change.tooltip': 'あなたのユーザー名を変更します',
    'header.username.copy.tooltip': 'あなたのプロフィールリンクをコピーします',
    'header.match': '試合',
    'header.everyonePool': 'みんなのプール',
    'header.logout': 'ログアウト',

    // View modes
    'view.myPool': 'マイピックプール',
    'view.myPool.tooltip': 'あなたのチャンピオン理解度を考慮した並び替えにします',
    'view.allChamps': '全チャンプ',
    'view.allChamps.tooltip': '純粋なスコア計算をした並び替えにします',
    'view.mastery': 'マスタリー順',
    'view.counter': 'カウンター',
    'view.counter.tooltip': 'あなたのピックプールに対するカウンターチャンピオンたちを並べます',
    'view.counter.user.tooltip': 'このピックプールに対するカウンターチャンピオンたちを並べます',
    'view.pool': 'ピックプール',

    // Champion list
    'champ.addToPool': '+ ピックプールに加える',
    'champ.emptyPool': 'あなたのピックプールがありません',
    'champ.goToAll': '全チャンプ',
    'champ.addFromAll': 'でチャンピオンを追加してください',
    'champ.tags.none': 'タグなし',
    'champ.loadingMastery': 'マスタリー取得に失敗しました: ',
    'champ.noRiotId': 'RiotIDを設定してください',
    'champ.viewOnOpgg': 'このチャンピオンをOP.GGで確認する',
    'champ.editRoleTag': 'このチャンピオンのロール・タグを編集します',
    'champ.setMatchup': 'このチャンピオンの対面を設定します',
    'dangerous.tooltip': 'このチャンプへのカウンターがピックプールにいません',
    'mastery.pts': '万pts',

    // Enemy champs
    'enemy.label': '相手チャンプ:',
    'enemy.add': '+ 追加',
    'enemy.clear': 'クリア',
    'enemy.banned': 'BAN済',
    'enemy.toBan': 'BANする',
    'enemy.picker.title': '相手チャンプを選択',
    'enemy.tooltip': '相手が使用するチャンピオンor相手の人が使用するかもしれないチャンピオン（ピックプール）を選択します',

    // BAN
    'ban.label': '🚫 BAN:',
    'ban.reset': 'BANリセット',

    // Tags/Lanes management
    'tagLane.manage': 'タグ・レーン管理',
    'tagLane.title': 'タグ・レーン管理',
    'tag.manage': 'タグ管理',
    'tag.new.placeholder.ja': '日本語タグ名...',
    'tag.new.placeholder.en': 'English name...',
    'tag.default': '（デフォルト）',
    'tag.bulkSet': 'チャンプ一括設定',
    'tag.delete': '削除',
    'tag.edit': '編集',
    'tag.edit.save': '保存',
    'tag.edit.cancel': 'キャンセル',
    'tag.setting': 'のチャンプ設定',
    'tag.back': '← 戻る',
    'lane.bulkSet': 'レーン一括設定',
    'lane.setting': 'のチャンプ設定',
    'lane.notSet': 'レーン未設定',

    // Form (add/edit)
    'form.edit': '編集',
    'form.add': '追加',
    'form.lane': 'レーン（複数選択可）',
    'form.priority': 'あなたのチャンピオン理解度: ',
    'form.priority.tooltip': '理解度が高ければ高いほどカウンターピックで表示する際に、優先的に並べられます',
    'form.tags': 'タグ（複数選択可）',
    'form.note': 'メモ（任意）',

    // Matchup
    'matchup.title': 'の対面設定',
    'matchup.bulk': '一括設定:',
    'matchup.favorable': '▲ 有利',
    'matchup.unfavorable': '▼ 不利',
    'matchup.skill': '● スキル',
    'matchup.none': '✕ 解除',
    'matchup.bulking': 'クリックで一括設定中',
    'matchup.setFor': 'を設定:',
    'matchup.neutral': '− ニュートラル',

    // Score detail
    'score.current': '現在: ',
    'score.beforeBan': 'BAN前: ',
    'score.banEffect': '↑BAN効果あり',
    'score.banUp': 'BANで↑',
    'score.banned': 'BAN済',
    'score.detail.myPool': '設定された対面に対する詳細を表示',
    'score.threat': '脅威スコア: ',
    'score.unfavorable': 'このチャンピオンに不利なあなたのピックプール',
    'score.unfavorable.user': 'このチャンピオンに不利なピックプール',
    'score.advantage': '− 有利/互角',
    'score.unfavorable.label': '▼ 不利',

    // Result form
    'result.title': '試合結果を記録',
    'result.myChamp': '自チャンプ: ',
    'result.selectEnemy': '相手チャンプを選択',
    'result.vs': '対 ',
    'result.currentWR': '現在の勝率: ',
    'result.win': '勝ち 🏆',
    'result.lose': '負け 💀',
    'result.wins': '勝',
    'result.losses': '敗',
    'result.noEnemy': '相手チャンプを設定してください',
    'result.record.tooltip': '戦績を入力します',
    'record': '記録',

    // Counter build
    'counterbuild': '対策ビルド',
    'counterbuild.tooltip': 'LolalyticsでVSページに飛ぶ',
    'counterbuild.select': 'の対面を選択',
    'counterbuild.open': '開く →',

    // Username modal
    'username.title': 'ユーザー名を設定',
    'username.desc': '他のユーザーがあなたのピックプールを閲覧できるURLになります',
    'username.placeholder': 'ユーザー名...',
    'username.error.taken': 'このユーザー名は既に使われています',
    'username.linkCopied': 'リンクをコピーしました！',

    // RiotID modal
    'riotid.title': 'RiotIDを設定',
    'riotid.desc': '例: Haru / JP1',
    'riotid.summoner': 'サモナーネーム',
    'riotid.tagline': 'タグライン',

    // User list
    'userlist.title': '👥 みんなのピックプール',
    'userlist.search': 'ユーザー名で検索...',
    'userlist.notFound': 'ユーザーが見つかりません',
    'userlist.view': '閲覧 →',
    'userlist.viewing': '表示中',

    // Login page
    'login.subtitle': 'LoLのピックプール管理ツール',
    'login.google': 'Googleでログイン',
    'login.discord': 'Discordでログイン',
    'login.or': 'または',
    'login.tab': 'ログイン',
    'login.register': '新規登録',
    'login.accountName': 'アカウント名',
    'login.accountName.note': '※ アカウント名は英数字のみ使用できます',
    'login.password': 'パスワード（6文字以上）',
    'login.register.note': '⚠️ アカウント名はログイン用です。\n他のユーザーに公開されるユーザー名はログイン後に別途設定できます。',
    'login.register.note.account': 'アカウント名',
    'login.register.note.username': 'ユーザー名',
    'login.error.wrong': 'アカウント名またはパスワードが違います',
    'login.error.shortName': 'アカウント名は3文字以上にしてください',
    'login.error.shortPass': 'パスワードは6文字以上にしてください',
    'login.error.taken': 'このアカウント名は既に使われています',
    'login.error.failed': '登録に失敗しました: ',
    'login.loading': '処理中...',
    'login.submit.login': 'ログイン',
    'login.submit.register': '登録',
    'login.guest.desc': '登録なしで閲覧だけしたい場合',
    'login.guest.btn': '👁 ゲストとして参加',

    // Guest page
    'guest.subtitle': '閲覧したいユーザーを選択してください',
    'guest.noUsers': 'ユーザーがいません',
    'guest.viewArrow': '閲覧 →',
    'guest.backToLogin': '← ログインページへ戻る',

    // Onboarding page
    'onboarding.title': 'Pick Pool Tool へようこそ！',
    'onboarding.subtitle': 'プロフィールを設定しましょう。後からでも変更できます。',
    'onboarding.username.label': 'ユーザー名',
    'onboarding.optional': '（任意）',
    'onboarding.username.desc': '他のユーザーがあなたのピックプールを閲覧できるURLになります',
    'onboarding.username.placeholder': '例: はるん',
    'onboarding.riotid.label': 'Riot ID',
    'onboarding.riotid.desc': 'OP.GGへのリンクに使用されます',
    'onboarding.riotid.placeholder': '例: はるん#JP1',
    'onboarding.save': '始める →',
    'onboarding.saving': '保存中...',
    'onboarding.skip.doNotShow': '今後このメッセージを表示しない',
    'onboarding.skip': '閉じる（スキップ）',
    'onboarding.error.taken': 'このユーザー名は既に使われています',

    // Auth confirm page
    'auth.loading': '確認中...',
    'auth.success.title': 'ログイン完了！',
    'auth.success.desc': '2秒後にアプリに移動します...',
    'auth.error.title': '認証に失敗しました',
    'auth.error.desc': 'もう一度お試しください。',
    'auth.error.btn': 'ログインページへ',
    'auth.loading.fb': '読み込み中...',

    // Match page
    'match.title': '⚔️ 試合一覧',
    'match.addBtn': '+ 試合を追加',
    'match.back': '← 戻る',
    'match.empty': '試合がありません。追加してみましょう！',
    'match.join': '参加 →',
    'match.deleteConfirm': 'この試合を削除しますか？',
    'match.addModal.title': '試合を追加',
    'match.addModal.placeholder': '試合名（例：5/31 カスタム）',
    'match.addModal.create': '作成',
    'match.delete': '削除',

    // Match detail page
    'matchDetail.team1': '🔵 チーム1',
    'matchDetail.team2': '🔴 チーム2',
    'matchDetail.participating': '（参加中）',
    'matchDetail.joinAs': 'として参加中',
    'matchDetail.changeTeam': 'チーム変更（現在: ',
    'matchDetail.reset': 'リセット',
    'matchDetail.resetConfirm': '試合をリセットしますか？',
    'matchDetail.ban': '🚫 BAN',
    'matchDetail.banSuggest': '💡 BANおすすめ',
    'matchDetail.banSuggest.title': '💡 BANおすすめ（相手チームのピックプールから）',
    'matchDetail.banAdd': '+ 追加',
    'matchDetail.banNone': 'BANなし',
    'matchDetail.member': '👤 メンバー',
    'matchDetail.pick': '+ ピック',
    'matchDetail.pickNone': 'ピックなし',
    'matchDetail.myPool': '🎯 あなたのピックプール',
    'matchDetail.enemies': '（相手: ',
    'matchDetail.poolEmpty': 'ピックプールが空です',
    'matchDetail.selectBan': '🚫 BANするチャンプを選択',
    'matchDetail.selectTeam1': '🔵 チーム1のピックを選択',
    'matchDetail.selectTeam2': '🔴 チーム2のピックを選択',
    'matchDetail.selectMember': 'のメンバーを選択',
    'matchDetail.laneSet': 'のレーンを設定',
    'matchDetail.laneNone': 'レーン指定なし',
    'matchDetail.joinTeam1': 'チーム1に参加します',
    'matchDetail.joinTeam2': 'チーム2に参加します',
    'matchDetail.opgg.tooltip': 'このチームのOP.GGマルチサーチを作成します',
    'matchDetail.score.current': '現在: ',
    'matchDetail.score.neutral': '± 0',

    // User page
    'userPage.pickPool': 'のピックプール',
    'userPage.viewOnly': '閲覧モード（編集不可）',
    'userPage.notFound': 'ユーザーが見つかりません',
    'userPage.goTop': 'トップへ',
    'userPage.everyonePool': '👥 みんなのプール',
    'userPage.myPage': '自分のページへ',
    'userPage.noRiotId': 'このユーザーはRiotIDを設定していません',
  },
  en: {
    // Common
    'close': 'Close',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'add': 'Add',
    'search': 'Search...',
    'all': 'All',
    'loading': 'Loading...',
    'done': 'Done',
    'back': '← Back',
    'none': 'None',

    // Language switcher
    'language.change': 'Change Language',
    'language.changeToJa': '日本語に変更',
    'language.changeToEn': 'Change to English',

    // Header (main page)
    'header.opgg.tooltip': 'Open your OP.GG profile',
    'header.riotid.set': 'Set RiotID',
    'header.riotid.change.tooltip': 'Change RiotID',
    'header.username.set': 'Set Username',
    'header.username.change.tooltip': 'Change your username',
    'header.username.copy.tooltip': 'Copy your profile link',
    'header.match': 'Match',
    'header.everyonePool': "Everyone's Pool",
    'header.logout': 'Logout',

    // View modes
    'view.myPool': 'My Pick Pool',
    'view.myPool.tooltip': 'Sort with your champion mastery considered',
    'view.allChamps': 'All Champs',
    'view.allChamps.tooltip': 'Sort by pure score calculation',
    'view.mastery': 'By Mastery',
    'view.counter': 'Counter',
    'view.counter.tooltip': 'Show counter champions for your pick pool',
    'view.counter.user.tooltip': 'Show counter champions for this pick pool',
    'view.pool': 'Pick Pool',

    // Champion list
    'champ.addToPool': '+ Add to Pick Pool',
    'champ.emptyPool': 'Your pick pool is empty',
    'champ.goToAll': 'All Champs',
    'champ.addFromAll': 'to add champions',
    'champ.tags.none': 'No Tags',
    'champ.loadingMastery': 'Failed to fetch mastery: ',
    'champ.noRiotId': 'Please set your RiotID',
    'champ.viewOnOpgg': 'View this champion on OP.GG',
    'champ.editRoleTag': 'Edit role and tags for this champion',
    'champ.setMatchup': 'Set matchups for this champion',
    'dangerous.tooltip': 'No counter in your pick pool for this champion',
    'mastery.pts': '0k pts',

    // Enemy champs
    'enemy.label': 'Enemy Champs:',
    'enemy.add': '+ Add',
    'enemy.clear': 'Clear',
    'enemy.banned': 'BANNED',
    'enemy.toBan': 'BAN',
    'enemy.picker.title': 'Select Enemy Champions',
    'enemy.tooltip': "Select champions the enemy is using or might use (their pick pool)",

    // BAN
    'ban.label': '🚫 BAN:',
    'ban.reset': 'Reset BAN',

    // Tags/Lanes management
    'tagLane.manage': 'Tag/Lane Mgmt',
    'tagLane.title': 'Tag/Lane Management',
    'tag.manage': 'Tag Management',
    'tag.new.placeholder.ja': 'Japanese name...',
    'tag.new.placeholder.en': 'English name...',
    'tag.default': '(Default)',
    'tag.bulkSet': 'Bulk Champion Set',
    'tag.delete': 'Delete',
    'tag.edit': 'Edit',
    'tag.edit.save': 'Save',
    'tag.edit.cancel': 'Cancel',
    'tag.setting': ' champion settings',
    'tag.back': '← Back',
    'lane.bulkSet': 'Bulk Lane Assignment',
    'lane.setting': ' champion settings',
    'lane.notSet': 'Lane not set',

    // Form (add/edit)
    'form.edit': 'Edit',
    'form.add': 'Add',
    'form.lane': 'Lane (multiple OK)',
    'form.priority': 'Your champion mastery: ',
    'form.priority.tooltip': 'Higher mastery = higher priority in counter pick suggestions',
    'form.tags': 'Tags (multiple OK)',
    'form.note': 'Note (optional)',

    // Matchup
    'matchup.title': ' matchup settings',
    'matchup.bulk': 'Bulk set:',
    'matchup.favorable': '▲ Win',
    'matchup.unfavorable': '▼ Lose',
    'matchup.skill': '● Skill',
    'matchup.none': '✕ Clear',
    'matchup.bulking': 'Click to bulk set',
    'matchup.setFor': ' settings:',
    'matchup.neutral': '− Neutral',

    // Score detail
    'score.current': 'Current: ',
    'score.beforeBan': 'Pre-BAN: ',
    'score.banEffect': '↑BAN has effect',
    'score.banUp': 'BAN↑',
    'score.banned': 'BANNED',
    'score.detail.myPool': 'Show matchup score details',
    'score.threat': 'Threat Score: ',
    'score.unfavorable': 'Your pick pool that loses to this champion',
    'score.unfavorable.user': 'Pick pool that loses to this champion',
    'score.advantage': '− Win/Even',
    'score.unfavorable.label': '▼ Loss',

    // Result form
    'result.title': 'Record Match Result',
    'result.myChamp': 'My champion: ',
    'result.selectEnemy': 'Select enemy champion',
    'result.vs': 'vs ',
    'result.currentWR': 'Current win rate: ',
    'result.win': 'Win 🏆',
    'result.lose': 'Lose 💀',
    'result.wins': 'W',
    'result.losses': 'L',
    'result.noEnemy': 'Please set enemy champions',
    'result.record.tooltip': 'Record match result',
    'record': 'Record',

    // Counter build
    'counterbuild': 'Counter Build',
    'counterbuild.tooltip': 'Open VS page on Lolalytics',
    'counterbuild.select': ' select enemy',
    'counterbuild.open': 'Open →',

    // Username modal
    'username.title': 'Set Username',
    'username.desc': 'Creates a URL where others can view your pick pool',
    'username.placeholder': 'Username...',
    'username.error.taken': 'This username is already taken',
    'username.linkCopied': 'Link copied!',

    // RiotID modal
    'riotid.title': 'Set RiotID',
    'riotid.desc': 'Example: Haru / JP1',
    'riotid.summoner': 'Summoner Name',
    'riotid.tagline': 'Tagline',

    // User list
    'userlist.title': "👥 Everyone's Pick Pool",
    'userlist.search': 'Search by username...',
    'userlist.notFound': 'No users found',
    'userlist.view': 'View →',
    'userlist.viewing': 'Viewing',

    // Login page
    'login.subtitle': 'LoL Pick Pool Management Tool',
    'login.google': 'Login with Google',
    'login.discord': 'Login with Discord',
    'login.or': 'or',
    'login.tab': 'Login',
    'login.register': 'Register',
    'login.accountName': 'Account Name',
    'login.accountName.note': '※ Account name must use alphanumeric characters only',
    'login.password': 'Password (6+ characters)',
    'login.register.note': '⚠️ Account name is for login only.\nThe publicly visible username can be set after login.',
    'login.register.note.account': 'Account name',
    'login.register.note.username': 'username',
    'login.error.wrong': 'Incorrect account name or password',
    'login.error.shortName': 'Account name must be at least 3 characters',
    'login.error.shortPass': 'Password must be at least 6 characters',
    'login.error.taken': 'This account name is already taken',
    'login.error.failed': 'Registration failed: ',
    'login.loading': 'Processing...',
    'login.submit.login': 'Login',
    'login.submit.register': 'Register',
    'login.guest.desc': 'Just want to browse without registering',
    'login.guest.btn': '👁 Join as Guest',

    // Guest page
    'guest.subtitle': 'Select a user to view',
    'guest.noUsers': 'No users',
    'guest.viewArrow': 'View →',
    'guest.backToLogin': '← Back to Login',

    // Onboarding page
    'onboarding.title': 'Welcome to Pick Pool Tool!',
    'onboarding.subtitle': 'Set up your profile. You can change it later.',
    'onboarding.username.label': 'Username',
    'onboarding.optional': '(optional)',
    'onboarding.username.desc': 'Creates a URL where others can view your pick pool',
    'onboarding.username.placeholder': 'e.g. Harun',
    'onboarding.riotid.label': 'Riot ID',
    'onboarding.riotid.desc': 'Used for OP.GG links',
    'onboarding.riotid.placeholder': 'e.g. Harun#JP1',
    'onboarding.save': 'Start →',
    'onboarding.saving': 'Saving...',
    'onboarding.skip.doNotShow': 'Do not show this again',
    'onboarding.skip': 'Close (Skip)',
    'onboarding.error.taken': 'This username is already taken',

    // Auth confirm page
    'auth.loading': 'Verifying...',
    'auth.success.title': 'Login Complete!',
    'auth.success.desc': 'Redirecting in 2 seconds...',
    'auth.error.title': 'Authentication Failed',
    'auth.error.desc': 'Please try again.',
    'auth.error.btn': 'Go to Login',
    'auth.loading.fb': 'Loading...',

    // Match page
    'match.title': '⚔️ Match List',
    'match.addBtn': '+ Add Match',
    'match.back': '← Back',
    'match.empty': 'No matches. Try adding one!',
    'match.join': 'Join →',
    'match.deleteConfirm': 'Delete this match?',
    'match.addModal.title': 'Add Match',
    'match.addModal.placeholder': 'Match name (e.g. 5/31 Custom)',
    'match.addModal.create': 'Create',
    'match.delete': 'Delete',

    // Match detail page
    'matchDetail.team1': '🔵 Team 1',
    'matchDetail.team2': '🔴 Team 2',
    'matchDetail.participating': '(in)',
    'matchDetail.joinAs': ' as participant',
    'matchDetail.changeTeam': 'Change Team (Current: ',
    'matchDetail.reset': 'Reset',
    'matchDetail.resetConfirm': 'Reset this match?',
    'matchDetail.ban': '🚫 BAN',
    'matchDetail.banSuggest': '💡 BAN Suggest',
    'matchDetail.banSuggest.title': '💡 BAN Suggestions (from enemy pick pool)',
    'matchDetail.banAdd': '+ Add',
    'matchDetail.banNone': 'No BANs',
    'matchDetail.member': '👤 Members',
    'matchDetail.pick': '+ Pick',
    'matchDetail.pickNone': 'No picks',
    'matchDetail.myPool': '🎯 Your Pick Pool',
    'matchDetail.enemies': '(enemy: ',
    'matchDetail.poolEmpty': 'Pick pool is empty',
    'matchDetail.selectBan': '🚫 Select champion to BAN',
    'matchDetail.selectTeam1': '🔵 Select Team 1 picks',
    'matchDetail.selectTeam2': '🔴 Select Team 2 picks',
    'matchDetail.selectMember': ' select members',
    'matchDetail.laneSet': ' lane setting',
    'matchDetail.laneNone': 'No lane',
    'matchDetail.joinTeam1': 'Join Team 1',
    'matchDetail.joinTeam2': 'Join Team 2',
    'matchDetail.opgg.tooltip': 'Open OP.GG multi-search for this team',
    'matchDetail.score.current': 'Score: ',
    'matchDetail.score.neutral': '± 0',

    // User page
    'userPage.pickPool': "'s Pick Pool",
    'userPage.viewOnly': 'View only (editing disabled)',
    'userPage.notFound': 'User not found',
    'userPage.goTop': 'Go to Top',
    'userPage.everyonePool': "👥 Everyone's Pool",
    'userPage.myPage': 'My Page',
    'userPage.noRiotId': 'This user has not set a RiotID',
  },
}

// Default tag translations (Japanese key → bilingual names)
export const defaultTagTranslations: Record<string, Record<Lang, string>> = {
  'ファイター': { ja: 'ファイター', en: 'Fighter' },
  'タンク': { ja: 'タンク', en: 'Tank' },
  'マジシャン': { ja: 'マジシャン', en: 'Mage' },
  'アサシン': { ja: 'アサシン', en: 'Assassin' },
  'マークスマン': { ja: 'マークスマン', en: 'Marksman' },
  'サポート': { ja: 'サポート', en: 'Support' },
  'エンゲージ': { ja: 'エンゲージ', en: 'Engage' },
  'スケーリング': { ja: 'スケーリング', en: 'Scaling' },
  'エンチャンター': { ja: 'エンチャンター', en: 'Enchanter' },
  'メイジ': { ja: 'メイジ', en: 'Mage' },
  'ダイブ': { ja: 'ダイブ', en: 'Dive' },
  'ピール': { ja: 'ピール', en: 'Peel' },
  'スプリット': { ja: 'スプリット', en: 'Split' },
  'アーリーゲーム': { ja: 'アーリーゲーム', en: 'Early Game' },
}

/**
 * Get display name for a tag in the given language.
 * Handles:
 * - Default tags (Japanese key → translated)
 * - Custom bilingual tags (JSON: {"ja":"...","en":"..."})
 * - Legacy plain string tags (shown as-is)
 */
export function getTagDisplayName(tagName: string, lang: Lang): string {
  if (defaultTagTranslations[tagName]) {
    return defaultTagTranslations[tagName][lang]
  }
  try {
    const parsed = JSON.parse(tagName)
    if (typeof parsed === 'object' && parsed !== null) {
      if (lang === 'en' && parsed.en) return parsed.en
      if (lang === 'ja' && parsed.ja) return parsed.ja
      if (parsed.ja) return parsed.ja
      if (parsed.en) return parsed.en
    }
  } catch {}
  return tagName
}

/**
 * Encode bilingual tag name into storage format.
 * - Both provided: JSON {"ja":"...","en":"..."}
 * - Only one provided: plain string
 */
export function encodeTagName(ja: string, en: string): string {
  const jaT = ja.trim()
  const enT = en.trim()
  if (!jaT && !enT) return ''
  if (jaT && !enT) return jaT
  if (!jaT && enT) return enT
  return JSON.stringify({ ja: jaT, en: enT })
}
