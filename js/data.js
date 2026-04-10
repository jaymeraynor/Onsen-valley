// ==========================================
// 【資料庫與數值公式】
// ==========================================

const availableLangs = ['zh', 'zh-CN', 'ja', 'ko', 'en', 'es'];

const i18n = {
    'zh':    { acorns:'橡子',    gems:'靈石',   lvl:'老闆Lv',  modeBuild:'🔨 建造/升級', modeDemolish:'🧨 拆除',     btnLang:'🌐 繁中',    btnDex:'📖 圖鑑', btnShop:'🛒 商店', btnRoster:'🎒 隊伍', btnFriend:'🤝 好友', btnSettings:'⚙️ 設定', btnCancel:'🚫 取消', btnExpand:'📜 購新地', btnGacha:'✨ 召喚', shopTitle:'精品商店', buy:'購買', msgUnlock:'✨ 解鎖！', timeAuto:'🕐 同步', timeDay:'☀️ 白天', timeNight:'🌙 夜晚',
               loginTitle:'📅 每日登入獎勵', loginClaim:'🎁 領取！', loginDone:'✅ 已領取', loginStreak:'連續登入', loginDays:'天', gachaTitle:'✨ 妖怪召喚', gachaPityLabel:'保底', gachaFree:'🎁 每日免費', gachaSingle:'單抽 (10💎)', gachaTen:'十連抽 (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ 每10抽必出SSR', gachaNew:'✨ 新！', gachaClose:'✕ 關閉', gachaNoGems:'靈石不足！' },
    'zh-CN': { acorns:'橡子',    gems:'灵石',   lvl:'老板Lv',  modeBuild:'🔨 建造/升级', modeDemolish:'🧨 拆除',     btnLang:'🌐 简中',    btnDex:'📖 图鉴', btnShop:'🛒 商店', btnRoster:'🎒 队伍', btnFriend:'🤝 好友', btnSettings:'⚙️ 设置', btnCancel:'🚫 取消', btnExpand:'📜 购新地', btnGacha:'✨ 召唤', shopTitle:'精品商店', buy:'购买', msgUnlock:'✨ 解锁！', timeAuto:'🕐 同步', timeDay:'☀️ 白天', timeNight:'🌙 夜晚',
               loginTitle:'📅 每日登入奖励', loginClaim:'🎁 领取！', loginDone:'✅ 已领取', loginStreak:'连续登录', loginDays:'天', gachaTitle:'✨ 妖怪召唤', gachaPityLabel:'保底', gachaFree:'🎁 每日免费', gachaSingle:'单抽 (10💎)', gachaTen:'十连抽 (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ 每10抽必出SSR', gachaNew:'✨ 新！', gachaClose:'✕ 关闭', gachaNoGems:'灵石不足！' },
    'ja':    { acorns:'どんぐり', gems:'霊石',   lvl:'ボスLv',  modeBuild:'🔨 建設/強化', modeDemolish:'🧨 撤去',     btnLang:'🌐 日本語',  btnDex:'📖 図鑑', btnShop:'🛒 店',   btnRoster:'🎒 隊列', btnFriend:'🤝 友達', btnSettings:'⚙️ 設定', btnCancel:'🚫 取消', btnExpand:'📜 拡張',  btnGacha:'✨ 召喚', shopTitle:'ブティック', buy:'購入', msgUnlock:'✨ 解放！', timeAuto:'🕐 自動', timeDay:'☀️ 昼', timeNight:'🌙 夜',
               loginTitle:'📅 デイリーログイン', loginClaim:'🎁 受け取る', loginDone:'✅ 受取済み', loginStreak:'連続ログイン', loginDays:'日', gachaTitle:'✨ 妖怪召喚', gachaPityLabel:'天井', gachaFree:'🎁 デイリー無料', gachaSingle:'単発 (10💎)', gachaTen:'10連 (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ 10連でSSR確定', gachaNew:'✨ 新！', gachaClose:'✕ 閉じる', gachaNoGems:'霊石不足！' },
    'ko':    { acorns:'도토리',  gems:'영석',   lvl:'보스 Lv', modeBuild:'🔨 건설/강화', modeDemolish:'🧨 철거',     btnLang:'🌐 한국어',  btnDex:'📖 도감', btnShop:'🛒 상점', btnRoster:'🎒 로스터', btnFriend:'🤝 친구', btnSettings:'⚙️ 설정', btnCancel:'🚫 취소', btnExpand:'📜 영지구매', btnGacha:'✨ 소환', shopTitle:'부티크', buy:'구매', msgUnlock:'✨ 해제!', timeAuto:'🕐 자동', timeDay:'☀️ 낮', timeNight:'🌙 밤',
               loginTitle:'📅 매일 로그인 보상', loginClaim:'🎁 받기！', loginDone:'✅ 수령 완료', loginStreak:'연속 로그인', loginDays:'일', gachaTitle:'✨ 요괴 소환', gachaPityLabel:'천장', gachaFree:'🎁 매일 무료', gachaSingle:'단뽑 (10💎)', gachaTen:'10연뽑 (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ 10연 SSR 확정', gachaNew:'✨ 신규！', gachaClose:'✕ 닫기', gachaNoGems:'영석 부족！' },
    'en':    { acorns:'Acorns',  gems:'Gems',   lvl:'Boss Lv', modeBuild:'🔨 Build/Up',  modeDemolish:'🧨 Demolish', btnLang:'🌐 English', btnDex:'📖 Dex',   btnShop:'🛒 Shop', btnRoster:'🎒 Roster', btnFriend:'🤝 Friend', btnSettings:'⚙️ Settings', btnCancel:'🚫 Cancel', btnExpand:'📜 Expand', btnGacha:'✨ Summon', shopTitle:'Boutique', buy:'Buy', msgUnlock:'✨ Unlocked!', timeAuto:'🕐 Auto', timeDay:'☀️ Day', timeNight:'🌙 Night',
               loginTitle:'📅 Daily Login Bonus', loginClaim:'🎁 Claim!', loginDone:'✅ Claimed', loginStreak:'Login Streak', loginDays:'days', gachaTitle:'✨ Yokai Summon', gachaPityLabel:'Pity', gachaFree:'🎁 Daily Free', gachaSingle:'Single (10💎)', gachaTen:'10-Pull (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ SSR guaranteed every 10', gachaNew:'✨ New!', gachaClose:'✕ Close', gachaNoGems:'Not enough Gems!' },
    'es':    { acorns:'Bellotas',gems:'Gemas',  lvl:'Nivel',   modeBuild:'🔨 Construir',  modeDemolish:'🧨 Demoler',  btnLang:'🌐 Español', btnDex:'📖 Códice',btnShop:'🛒 Tienda',btnRoster:'🎒 Equipo',btnFriend:'🤝 Amigo', btnSettings:'⚙️ Ajustes', btnCancel:'🚫 Cancelar', btnExpand:'📜 Expandir', btnGacha:'✨ Invocar', shopTitle:'Boutique', buy:'Comprar', msgUnlock:'✨ ¡Desbloqueado!', timeAuto:'🕐 Auto', timeDay:'☀️ Día', timeNight:'🌙 Noche',
               loginTitle:'📅 Bono de Inicio Diario', loginClaim:'🎁 Reclamar', loginDone:'✅ Reclamado', loginStreak:'Racha de Inicio', loginDays:'días', gachaTitle:'✨ Invocar Yokai', gachaPityLabel:'Piedad', gachaFree:'🎁 Gratis Diario', gachaSingle:'Individual (10💎)', gachaTen:'10 Tiros (90💎)', gachaRates:'SSR 3% ｜ SR 20% ｜ R 77% ｜ SSR garantizado cada 10', gachaNew:'✨ ¡Nuevo!', gachaClose:'✕ Cerrar', gachaNoGems:'¡Gemas insuficientes!' }
};

const yokaiDatabase = [
    { id: 0, key: 'yk_0', emoji: '🦊', rarity: 'SSR', 
      colors: { body: 0xffa502, blush: 0xff4757 }, 
      name: { zh: '九尾狐', 'zh-CN': '九尾狐', ja: '九尾の狐', ko: '구미호', en: 'Kitsune', es: 'Kitsune' }, affection: 0, unlocked: false, 
      trait: { zh: '尋寶 (靈石+15%)', 'zh-CN': '寻宝 (灵石+15%)', ja: '宝探し (霊石+15%)', ko: '보물찾기 (영석+15%)', en: 'Radar (Gem +15%)', es: 'Radar (Gemas +15%)' }, 
      lore: { zh: '曾是一位神靈的使者。', 'zh-CN': '曾是一位神灵的使者。', ja: 'かつて神の使いだった。', ko: '과거 신의 사자였다.', en: 'A divine messenger.', es: 'Un mensajero divino.' } },
      
    { id: 1, key: 'yk_1', emoji: '🐸', rarity: 'R', 
      colors: { body: 0x2ed573, blush: 0x1e90ff }, 
      name: { zh: '溫泉蛙', 'zh-CN': '温泉蛙', ja: '温泉カエル', ko: '온천 개구리', en: 'Frog', es: 'Rana' }, affection: 0, unlocked: false, 
      trait: { zh: '帶路 (時間-20%)', 'zh-CN': '带路 (时间-20%)', ja: '道案内 (時間-20%)', ko: '길잡이 (시간-20%)', en: 'Pathfinder (Time -20%)', es: 'Guía (Tiempo -20%)' }, 
      lore: { zh: '歌聲能維持水溫。', 'zh-CN': '歌声能维持水温。', ja: '歌声で湯温を保つ。', ko: '노래로 수온을 유지한다.', en: 'Song maintains heat.', es: 'Su canto calienta el agua.' } },
      
    { id: 2, key: 'yk_2', emoji: '🐼', rarity: 'SR', 
      colors: { body: 0xf1f2f6, blush: 0x2f3542 }, 
      name: { zh: '竹熊貓', 'zh-CN': '竹熊猫', ja: 'パンダ', ko: '대나무 판다', en: 'Panda', es: 'Panda' }, affection: 0, unlocked: false, 
      trait: { zh: '滿載 (橡子+30%)', 'zh-CN': '满载 (橡子+30%)', ja: '大盛り (どんぐり+30%)', ko: '가득 (도토리+30%)', en: 'Hoarder (Acorn +30%)', es: 'Acaparador (Bellota +30%)' }, 
      lore: { zh: '為了讓毛皮蓬鬆而來。', 'zh-CN': '为了让毛皮蓬松而来。', ja: '毛並みをフワフワにするため。', ko: '털을 푹신하게 하려고 온다.', en: 'Bathes for fluffy fur.', es: 'Se baña para esponjar su pelaje.' } },
      
    { id: 3, key: 'yk_3', emoji: '👻', rarity: 'R',
      colors: { body: 0xdfe6e9, blush: 0xa4b0be },
      name: { zh: '小幽靈', 'zh-CN': '小幽灵', ja: '子幽霊', ko: '꼬마 유령', en: 'Ghost', es: 'Fantasmita' }, affection: 0, unlocked: false,
      trait: { zh: '飄浮 (橡子+10%, 時間-10%)', 'zh-CN': '飘浮 (橡子+10%, 时间-10%)', ja: '浮遊 (どんぐり+10%, 時間-10%)', ko: '부유 (도토리+10%, 시간-10%)', en: 'Float (Acorn+10%, Time-10%)', es: 'Flotar (Bellota+10%, Tiempo-10%)' },
      lore: { zh: '常常飄過溫泉池底。', 'zh-CN': '常常飘过温泉池底。', ja: 'よく温泉の底を漂っている。', ko: '온천 바닥을 자주 떠다닌다.', en: 'Floats through floors.', es: 'Flota por el fondo de la piscina.' } },

    // ── 召喚限定妖怪（S級池）────────────────────────────────────────
    { id: 4, key: 'yk_4', emoji: '🌸', rarity: 'SSR',
      colors: { body: 0xff7eb3, blush: 0xfd79a8 },
      name: { zh: '櫻花精', 'zh-CN': '樱花精', ja: '桜精', ko: '벚꽃 정령', en: 'Sakura Spirit', es: 'Espíritu Sakura' }, affection: 0, unlocked: false,
      trait: { zh: '花語 (橡子+20%, 靈石+10%)', 'zh-CN': '花语 (橡子+20%, 灵石+10%)', ja: '花言葉 (どんぐり+20%, 霊石+10%)', ko: '꽃말 (도토리+20%, 영석+10%)', en: 'Bloom (Acorn+20%, Gem+10%)', es: 'Flor (Bellota+20%, Gema+10%)' },
      lore: { zh: '每逢春日，以花瓣雨治癒疲憊旅人。', 'zh-CN': '每逢春日，以花瓣雨治愈疲惫旅人。', ja: '春になると花びらの雨で旅人を癒す。', ko: '봄마다 꽃잎 비로 지친 나그네를 치유한다.', en: 'Each spring, heals travelers with a rain of petals.', es: 'Cada primavera sana viajeros con lluvia de pétalos.' } },

    { id: 5, key: 'yk_5', emoji: '🐢', rarity: 'SR',
      colors: { body: 0x00b894, blush: 0x55efc4 },
      name: { zh: '玄武龜', 'zh-CN': '玄武龟', ja: '玄武の亀', ko: '현무 거북', en: 'Genbu Turtle', es: 'Tortuga Genbu' }, affection: 0, unlocked: false,
      trait: { zh: '長壽 (橡子+15%, 時間-15%)', 'zh-CN': '长寿 (橡子+15%, 时间-15%)', ja: '長寿 (どんぐり+15%, 時間-15%)', ko: '장수 (도토리+15%, 시간-15%)', en: 'Longevity (Acorn+15%, Time-15%)', es: 'Longevidad (Bellota+15%, Tiempo-15%)' },
      lore: { zh: '守護溫泉谷千年，步伐緩慢卻充滿智慧。', 'zh-CN': '守护温泉谷千年，步伐缓慢却充满智慧。', ja: '温泉谷を千年守ってきた、歩みは遅いが知恵に満ちている。', ko: '온천 계곡을 천 년간 지켜온 느리지만 지혜로운 존재.', en: 'Guarded Onsen Valley for a millennium — slow but wise.', es: 'Guardó el Valle Onsen por milenios, lento pero sabio.' } },

    { id: 6, key: 'yk_6', emoji: '🦁', rarity: 'SSR',
      colors: { body: 0xfdcb6e, blush: 0xe17055 },
      name: { zh: '雷獅', 'zh-CN': '雷狮', ja: '雷獅', ko: '뇌사자', en: 'Thunder Lion', es: 'León del Trueno' }, affection: 0, unlocked: false,
      trait: { zh: '閃電 (橡子+25%, 靈石+15%)', 'zh-CN': '闪电 (橡子+25%, 灵石+15%)', ja: '稲妻 (どんぐり+25%, 霊石+15%)', ko: '번개 (도토리+25%, 영석+15%)', en: 'Lightning (Acorn+25%, Gem+15%)', es: 'Rayo (Bellota+25%, Gema+15%)' },
      lore: { zh: '雨夜現身，為溫泉帶來天然電熱能量。', 'zh-CN': '雨夜现身，为温泉带来天然电热能量。', ja: '雨夜に現れ温泉に天然の電気エネルギーをもたらす。', ko: '비 오는 밤 온천에 천연 전기 에너지를 가져온다.', en: 'Appears on rainy nights bringing electric energy to the springs.', es: 'Aparece en noches lluviosas trayendo energía eléctrica.' } },

    { id: 7, key: 'yk_7', emoji: '🐰', rarity: 'SR',
      colors: { body: 0xa29bfe, blush: 0x6c5ce7 },
      name: { zh: '月兔', 'zh-CN': '月兔', ja: '月の兎', ko: '달 토끼', en: 'Moon Rabbit', es: 'Conejo Lunar' }, affection: 0, unlocked: false,
      trait: { zh: '夜舞 (靈石+20%)', 'zh-CN': '夜舞 (灵石+20%)', ja: '夜舞 (霊石+20%)', ko: '밤춤 (영석+20%)', en: 'Night Dance (Gem+20%)', es: 'Danza Nocturna (Gema+20%)' },
      lore: { zh: '月圓之夜在水面起舞，令旅人忘憂。', 'zh-CN': '月圆之夜在水面起舞，令旅人忘忧。', ja: '満月の夜に水面で踊り旅人の悩みを忘れさせる。', ko: '보름달 밤 수면 위에서 춤추며 나그네의 걱정을 녹인다.', en: 'Dances on water under the full moon, washing away worries.', es: 'Baila sobre el agua en luna llena, disipando penas.' } },

    { id: 8, key: 'yk_8', emoji: '🍄', rarity: 'R',
      colors: { body: 0xe17055, blush: 0xfab1a0 },
      name: { zh: '蘑菇精', 'zh-CN': '蘑菇精', ja: 'キノコ精', ko: '버섯 정령', en: 'Mushroom Sprite', es: 'Duende Seta' }, affection: 0, unlocked: false,
      trait: { zh: '孢子 (橡子+10%)', 'zh-CN': '孢子 (橡子+10%)', ja: '胞子 (どんぐり+10%)', ko: '포자 (도토리+10%)', en: 'Spore (Acorn+10%)', es: 'Espora (Bellota+10%)' },
      lore: { zh: '喜歡在溫泉邊撒播快樂孢子，讓人心情大好。', 'zh-CN': '喜欢在温泉边撒播快乐孢子。', ja: '温泉そばに喜びの胞子を撒く。', ko: '온천 옆에 행복 포자를 뿌린다.', en: 'Scatters happy spores near the springs.', es: 'Dispersa esporas felices cerca de las aguas.' } },

    { id: 9, key: 'yk_9', emoji: '🌊', rarity: 'R',
      colors: { body: 0x74b9ff, blush: 0x0984e3 },
      name: { zh: '海龍童子', 'zh-CN': '海龙童子', ja: '海龍の子', ko: '바다 용 동자', en: 'Sea Dragon Child', es: 'Niño Dragón Mar' }, affection: 0, unlocked: false,
      trait: { zh: '水流 (時間-15%)', 'zh-CN': '水流 (时间-15%)', ja: '水流 (時間-15%)', ko: '수류 (시간-15%)', en: 'Tide (Time-15%)', es: 'Marea (Tiempo-15%)' },
      lore: { zh: '從海底慕名而來，只為泡一泡傳說中的溫泉。', 'zh-CN': '从海底慕名而来，只为泡传说中的温泉。', ja: '伝説の温泉に入るため海底からやってきた。', ko: '전설의 온천을 즐기러 해저에서 올라왔다.', en: 'Climbed from the deep sea just to soak in the legendary springs.', es: 'Salió del fondo del mar solo para disfrutar de los manantiales legendarios.' } }
];

// ── 召喚池配置 ─────────────────────────────────────────────────────
const gachaPool = {
    SSR: [0, 4, 6],   // 九尾狐・櫻花精・雷獅
    SR:  [2, 5, 7],   // 竹熊貓・玄武龜・月兔
    R:   [1, 3, 8, 9] // 溫泉蛙・小幽靈・蘑菇精・海龍童子
};

// ── 每日登入獎勵表（7天一循環）─────────────────────────────────────
const loginRewardTable = [
    { acorn: 100, gem: 0,  icon: '🌰', label: { zh:'100🌰', 'zh-CN':'100🌰', ja:'100🌰', ko:'100🌰', en:'100🌰', es:'100🌰' } },
    { acorn:   0, gem: 5,  icon: '💎', label: { zh:'5💎',   'zh-CN':'5💎',   ja:'5💎',   ko:'5💎',   en:'5💎',   es:'5💎'   } },
    { acorn: 200, gem: 0,  icon: '🌰', label: { zh:'200🌰', 'zh-CN':'200🌰', ja:'200🌰', ko:'200🌰', en:'200🌰', es:'200🌰' } },
    { acorn:   0, gem: 10, icon: '💎', label: { zh:'10💎',  'zh-CN':'10💎',  ja:'10💎',  ko:'10💎',  en:'10💎',  es:'10💎'  } },
    { acorn: 300, gem: 0,  icon: '🌰', label: { zh:'300🌰', 'zh-CN':'300🌰', ja:'300🌰', ko:'300🌰', en:'300🌰', es:'300🌰' } },
    { acorn:   0, gem: 15, icon: '💎', label: { zh:'15💎',  'zh-CN':'15💎',  ja:'15💎',  ko:'15💎',  en:'15💎',  es:'15💎'  } },
    { acorn: 500, gem: 30, icon: '🎁', label: { zh:'500🌰+30💎', 'zh-CN':'500🌰+30💎', ja:'500🌰+30💎', ko:'500🌰+30💎', en:'500🌰+30💎', es:'500🌰+30💎' } },
];

const itemDatabase = [
    { id: 'fence', emoji: '🪵', type: 'BASIC', price: 0, currency: 'FREE', isLight: false, isWall: true, 
      name: {zh:'木籬笆(可升級)', 'zh-CN':'木篱笆(可升级)', ja:'木の柵(強化可)', ko:'나무 울타리(강화가능)', en:'Fence', es:'Valla'} },
    { id: 'path', emoji: '🪨', type: 'ART', price: 10, currency: 'ACORN', isLight: false, isWall: false, 
      name: {zh:'立體石板路', 'zh-CN':'立体石板路', ja:'石畳の道', ko:'돌길', en:'Stone Path', es:'Camino de Piedra'} },
    { id: 'lantern', emoji: '🏮', type: 'ART', price: 150, currency: 'ACORN', isLight: true, lightColor: 0xf1c40f, isWall: false, 
      name: {zh:'暖光石燈籠', 'zh-CN':'暖光石灯笼', ja:'石灯籠', ko:'돌조명', en:'Lantern', es:'Linterna'} },
    { id: 'torii', emoji: '⛩️', type: 'SPECIAL', price: 30, currency: 'GEM', isLight: true, lightColor: 0xff7675, isWall: false, 
      name: {zh:'發光鳥居', 'zh-CN':'发光鸟居', ja:'光る鳥居', ko:'빛나는 토리이', en:'Torii', es:'Torii'} }
];

const poolColors = [ null, { w: 0x74b9ff, l: 0x0984e3, r: 0x0652dd }, { w: 0xfd79a8, l: 0xe84393, r: 0xb71540 }, { w: 0xffeaa7, l: 0xf39c12, r: 0xd35400 }, { w: 0x55efc4, l: 0x00b894, r: 0x00846a }, { w: 0xa29bfe, l: 0x6c5ce7, r: 0x4834d4 }, { w: 0xff7675, l: 0xd63031, r: 0xb33939 } ];
const unlockLevels = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55];

const islandDatabase = [
    { id: 0, cx: 0, cy: 0, radius: 130, requiredLevel: 0,
      name: { zh: '湯之谷', 'zh-CN': '汤之谷', ja: '湯の谷', ko: '온천 계곡', en: 'Onsen Valley', es: 'Valle Onsen' } },
    { id: 1, cx: 220, cy: -90, radius: 70, requiredLevel: 5,
      name: { zh: '霧島', 'zh-CN': '雾岛', ja: '霧島', ko: '안개 섬', en: 'Mist Isle', es: 'Isla Niebla' } },
    { id: 2, cx: -190, cy: 150, radius: 60, requiredLevel: 12,
      name: { zh: '竹林島', 'zh-CN': '竹林岛', ja: '竹林島', ko: '대나무 섬', en: 'Bamboo Isle', es: 'Isla Bambú' } },
    { id: 3, cx: 230, cy: 210, radius: 80, requiredLevel: 25,
      name: { zh: '火山島', 'zh-CN': '火山岛', ja: '火山島', ko: '화산 섬', en: 'Volcano Isle', es: 'Isla Volcán' } },
    { id: 4, cx: -220, cy: -190, radius: 55, requiredLevel: 40,
      name: { zh: '極光島', 'zh-CN': '极光岛', ja: 'オーロラ島', ko: '오로라 섬', en: 'Aurora Isle', es: 'Isla Aurora' } }
];

function getExpRequired(lvl) { return Math.floor(100 * Math.pow(1.5, lvl - 1)); }
function getCost(level) { return Math.floor(50 * Math.pow(1.8, level - 1)); }
function getYield(level) { return Math.floor(15 * Math.pow(1.5, level - 1)); }
function getTileExpandCost(count) { return Math.floor(500 + count * 400); }
function getCapacity(level) { return Math.floor(1 + level / 3); } 

function findPath(startX, startY, endX, endY, map, size, decors) {
    let maxSearch = 1500; 
    let openList = [{x: startX, y: startY, g: 0, h: 0, f: 0, parent: null}], closedList = [];
    while(openList.length > 0 && closedList.length < maxSearch) {
        openList.sort((a, b) => a.f - b.f); let current = openList.shift(); closedList.push(current);
        if (current.x === endX && current.y === endY) {
            let path = []; let curr = current;
            while(curr != null) { path.push({x: curr.x, y: curr.y}); curr = curr.parent; }
            return path.reverse();
        }
        let neighbors = [ {x: current.x, y: current.y - 1}, {x: current.x, y: current.y + 1}, {x: current.x - 1, y: current.y}, {x: current.x + 1, y: current.y} ];
        for (let i=0; i<neighbors.length; i++) {
            let nx = neighbors[i].x, ny = neighbors[i].y;
            if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
            let tile = map[ny][nx];
            if (!tile.unlocked) continue; 
            if (tile.status !== 0 && !(nx === endX && ny === endY) && tile.status !== -1) continue; 
            let hasWall = decors.some(d => d.gx === nx && d.gy === ny && d.isWall);
            if (hasWall && !(nx === endX && ny === endY)) continue;
            if (closedList.find(n => n.x === nx && n.y === ny)) continue;
            let g = current.g + 1; let h = Math.abs(nx - endX) + Math.abs(ny - endY); let f = g + h;
            let existing = openList.find(n => n.x === nx && n.y === ny);
            if (existing) { if (g < existing.g) { existing.g = g; existing.f = f; existing.parent = current; } } else { openList.push({x: nx, y: ny, g: g, h: h, f: f, parent: current}); }
        }
    }
    return []; 
}
