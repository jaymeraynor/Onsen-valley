// ==========================================
// 【資料庫與數值公式】
// ==========================================

const availableLangs = ['zh', 'zh-CN', 'ja', 'ko', 'en', 'es'];

const i18n = {
    'zh': { acorns: '橡子', gems: '靈石', lvl: '老闆Lv', modeBuild: '🔨 建造/升級', modeDemolish: '🧨 拆除', btnLang: '🌐 繁中', btnDex: '📖 圖鑑', btnShop: '🛒 商店', shopTitle: '精品商店', buy: '購買', msgUnlock: '✨ 解鎖！', timeAuto: '🕐 同步', timeDay: '☀️ 白天', timeNight: '🌙 夜晚' },
    'zh-CN': { acorns: '橡子', gems: '灵石', lvl: '老板Lv', modeBuild: '🔨 建造/升级', modeDemolish: '🧨 拆除', btnLang: '🌐 简中', btnDex: '📖 图鉴', btnShop: '🛒 商店', shopTitle: '精品商店', buy: '购买', msgUnlock: '✨ 解锁！', timeAuto: '🕐 同步', timeDay: '☀️ 白天', timeNight: '🌙 夜晚' },
    'ja': { acorns: 'どんぐり', gems: '霊石', lvl: 'ボスLv', modeBuild: '🔨 建設/強化', modeDemolish: '🧨 撤去', btnLang: '🌐 日本語', btnDex: '📖 図鑑', btnShop: '🛒 店', shopTitle: 'ブティック', buy: '購入', msgUnlock: '✨ 解放！', timeAuto: '🕐 自動', timeDay: '☀️ 昼', timeNight: '🌙 夜' },
    'ko': { acorns: '도토리', gems: '영석', lvl: '보스 Lv', modeBuild: '🔨 건설/강화', modeDemolish: '🧨 철거', btnLang: '🌐 한국어', btnDex: '📖 도감', btnShop: '🛒 상점', shopTitle: '부티크', buy: '구매', msgUnlock: '✨ 해제!', timeAuto: '🕐 자동', timeDay: '☀️ 낮', timeNight: '🌙 밤' },
    'en': { acorns: 'Acorns', gems: 'Gems', lvl: 'Boss Lv', modeBuild: '🔨 Build/Up', modeDemolish: '🧨 Demolish', btnLang: '🌐 English', btnDex: '📖 Dex', btnShop: '🛒 Shop', shopTitle: 'Boutique', buy: 'Buy', msgUnlock: '✨ Unlocked!', timeAuto: '🕐 Auto', timeDay: '☀️ Day', timeNight: '🌙 Night' },
    'es': { acorns: 'Bellotas', gems: 'Gemas', lvl: 'Nivel', modeBuild: '🔨 Construir', modeDemolish: '🧨 Demoler', btnLang: '🌐 Español', btnDex: '📖 Códice', btnShop: '🛒 Tienda', shopTitle: 'Boutique', buy: 'Comprar', msgUnlock: '✨ ¡Desbloqueado!', timeAuto: '🕐 Auto', timeDay: '☀️ Día', timeNight: '🌙 Noche' }
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
      lore: { zh: '常常飄過溫泉池底。', 'zh-CN': '常常飘过温泉池底。', ja: 'よく温泉の底を漂っている。', ko: '온천 바닥을 자주 떠다닌다.', en: 'Floats through floors.', es: 'Flota por el fondo de la piscina.' } }
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
