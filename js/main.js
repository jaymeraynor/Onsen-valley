// ==========================================
// 【全域狀態與參數】
// ==========================================
let pools = [], decors = [], townNpcs = []; 
let score = 2500, premiumCoin = 250, playerLevel = 1, playerExp = 0;
let questStats = { yokaiServed: 0, buildCount: 0, expandCount: 0, decorCount: 0 };
let currentQuest = null;
let tutorialStep = 0; 
let guideFinger = null; 
let staff = { promoter: false, foreman: false };
let selfRef, spawnTimerEvent, nightOverlay;
let isBuildMode = true; // global so HTML UI can read it
let activeShopItem = null, timeMode = 'auto', activeExpedition = null;
let ownedYokais = [];
let unlockedIslands = [0];

// ── 每日登入 & 召喚系統 ─────────────────────────────────────────────
let lastLoginDate   = null;   // 'Mon Apr 07 2026' (Date.toDateString)
let loginStreak     = 0;
let lastFreeDrawDate = null;  // 上次每日免費抽的日期
let gachaPity       = 0;      // 累計抽次(未出SSR)，10次保底

let isGameLoaded = false; 

let gridSize = 800;
const centerGrid = Math.floor(gridSize / 2);
const halfWidth = 32, halfHeight = 16, tileThickness = 0;
const offsetX = gridSize * halfWidth, offsetY = 0;
const SAVE_KEY = 'yokai_hotspring_save_v1_8';

// --- [防禦 iOS Safari 隱私權限制導致的白畫面] ---
let userSettings = { sfx: true, music: true, vfx: true, lang: null };
try {
    let savedSettings = localStorage.getItem('yokai_settings');
    if (savedSettings) userSettings = JSON.parse(savedSettings);
} catch (e) {
    console.warn("無法讀取本機設定，可能處於無痕模式或受隱私權限制");
}

function getDeviceLanguage() {
    if (userSettings.lang) return userSettings.lang;
    let browserLang = navigator.language || navigator.userLanguage || 'en';
    if (browserLang.includes('zh-CN')) return 'zh-CN';
    if (browserLang.includes('zh')) return 'zh';
    let shortLang = browserLang.split('-')[0];
    if (availableLangs.includes(shortLang)) return shortLang;
    return 'en';
}
let currentLang = getDeviceLanguage();

let tilePool = [], fogPool = [], signPool = [], villagePool = [];
let activeTiles = [], activeFogs = [], activeSigns = [], activeVillages = [];
let mapData = [];

function getBuildTime(level) { let b = Math.floor(10 * Math.pow(1.8, level - 1)); return staff.foreman ? Math.floor(b*0.5) : b; } 
function t(key) { return i18n[currentLang][key] || key; }

// Update all fixed HTML UI text to match currentLang
function updateHTMLLang() {
    hText('hbtn-build',    isBuildMode ? t('modeBuild') : t('modeDemolish'));
    hText('hbtn-settings', t('btnSettings'));
    hText('hbtn-dex',      t('btnDex'));
    hText('hbtn-shop',     t('btnShop'));
    hText('hbtn-roster',   t('btnRoster'));
    hText('hbtn-friend',   t('btnFriend'));
    hText('hbtn-time',     t('timeAuto'));
    hText('hbtn-gacha',    t('btnGacha'));
}

// HTML UI helpers — update fixed overlay elements without touching Phaser camera
function hEl(id) { return document.getElementById(id); }
function hText(id, txt) { let e = hEl(id); if (e) e.textContent = txt; }
function hShow(id, v)   { let e = hEl(id); if (e) e.style.display = v ? '' : 'none'; }

// [共用模組] 提升為全域函式，方便所有新模組呼叫
function showFloatingText(x, y, text, color, fontSize = '18px', isFixed = false) {
    if (!userSettings.vfx && !isFixed) return; 
    if (!selfRef) return;
    let t = selfRef.add.text(x, y, text, { fontSize: fontSize, fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setDepth(2500).setOrigin(0.5);
    if (isFixed) t.setScrollFactor(0); 
    selfRef.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 2000, onComplete: () => t.destroy() });
}

// --- [增加手機版自動縮放適配] ---
const config = {
    type: Phaser.AUTO,
    backgroundColor: '#0652dd',
    scale: {
        parent: 'game-wrap',
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: window.innerWidth,
        height: window.innerHeight
    },
    scene: { preload: preload, create: create, update: update }
};
const game = new Phaser.Game(config);

let uiScore, uiPremium, uiPlayerLvl, uiQuest, uiMode, btnSettings, uiTime, btnTimeToggle, uiExpedTracker, uiBuildCancel, uiSaveSync;
let dexPanel = null, shopPanel = null, expedPanel = null, rosterPanel = null, settingsPanel = null;
let cursor;
let soundWaterfall, soundDay, soundNight;

function preload() {
    let g = this.make.graphics({x: 0, y: 0, add: false});
    
    function draw3DTile(key, topColor, leftColor, rightColor, isWater = false) {
        g.fillStyle(rightColor, 1); g.beginPath(); g.moveTo(32, 32); g.lineTo(64, 16); g.lineTo(64, 16+tileThickness); g.lineTo(32, 32+tileThickness); g.closePath(); g.fillPath();
        g.fillStyle(leftColor, 1); g.beginPath(); g.moveTo(32, 32); g.lineTo(0, 16); g.lineTo(0, 16+tileThickness); g.lineTo(32, 32+tileThickness); g.closePath(); g.fillPath();
        g.fillStyle(topColor, 1); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath();
        
        g.lineStyle(2, 0xffffff, isWater ? 0.4 : 0.2); g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 0); g.lineTo(64, 16); g.strokePath(); 
        g.lineStyle(2, 0x000000, isWater ? 0.1 : 0.15); g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 32); g.lineTo(64, 16); g.strokePath(); 

        if (!isWater && (topColor === 0x7bed9f || topColor === 0x2ed573)) {
            g.fillStyle(0x000000, 0.06);
            for(let i=0; i<20; i++){ let px = 8 + Math.random()*48; let py = 6 + Math.random()*20; g.fillCircle(px, py, 0.5 + Math.random()*1.5); }
        }
        if (isWater) {
            g.lineStyle(1.5, 0xffffff, 0.5); g.beginPath(); g.moveTo(16, 16); g.lineTo(26, 21); g.strokePath(); g.beginPath(); g.moveTo(38, 11); g.lineTo(52, 18); g.strokePath();
        }
        g.generateTexture(key, 64, 32 + tileThickness); g.clear();
    }
    
    draw3DTile('grass1', 0x7bed9f, 0x8b5a2b, 0x654321); draw3DTile('grass2', 0x2ed573, 0x8b5a2b, 0x654321);
    draw3DTile('river', 0x3498db, 0x2980b9, 0x1f3a93, true); draw3DTile('waterfall', 0x74b9ff, 0x0984e3, 0x0652dd, true);
    draw3DTile('ocean', 0x0984e3, 0x0652dd, 0x023e8a, true);
    draw3DTile('cliff', 0x2d3436, 0x1e272e, 0x000000);
    g.fillStyle(0x000000, 0.45); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath(); g.generateTexture('fog', 64, 32); g.clear();

    g.fillStyle(0x2c3e50, 1); g.beginPath(); g.moveTo(32, 90); g.lineTo(64, 74); g.lineTo(40, 20); g.lineTo(32, 0); g.closePath(); g.fillPath();
    g.fillStyle(0x34495e, 1); g.beginPath(); g.moveTo(32, 90); g.lineTo(0, 74); g.lineTo(24, 20); g.lineTo(32, 0); g.closePath(); g.fillPath();
    g.fillStyle(0xdfe6e9, 1); g.beginPath(); g.moveTo(32, 38); g.lineTo(40, 20); g.lineTo(48, 42); g.lineTo(40, 32); g.lineTo(32, 45); g.closePath(); g.fillPath();
    g.fillStyle(0xffffff, 1); g.beginPath(); g.moveTo(32, 38); g.lineTo(24, 20); g.lineTo(16, 42); g.lineTo(24, 32); g.lineTo(32, 45); g.closePath(); g.fillPath();
    g.generateTexture('mountain', 64, 90); g.clear();
    
    g.fillStyle(0xffffff, 0.4); g.fillCircle(8, 8, 8); g.generateTexture('steamTexture', 16, 16); g.clear();

    g.fillStyle(0xffffff, 0.8); g.fillCircle(4, 4, 4); g.generateTexture('snowParticle', 8, 8); g.clear();
    g.fillStyle(0xff9ff3, 0.9); g.fillEllipse(6, 4, 12, 6); g.generateTexture('sakuraParticle', 12, 8); g.clear();

    function drawQYokai(key, colors) {
        g.fillStyle(0x000000, 0.15);
        g.fillEllipse(16, 28, 24, 6);
        g.fillStyle(colors.body, 1);
        g.fillRoundedRect(4, 6, 24, 20, 10); 
        g.fillEllipse(16, 24, 28, 10);       
        g.fillStyle(0x2d3436, 1);
        g.fillCircle(11, 15, 2); 
        g.fillCircle(21, 15, 2); 
        g.fillStyle(colors.blush, 0.6);
        g.fillCircle(6, 18, 2.5);  
        g.fillCircle(26, 18, 2.5); 
        g.generateTexture(key, 32, 32); 
        g.clear();
    }
    
    yokaiDatabase.forEach(yokai => { drawQYokai(yokai.key, yokai.colors); });

    // --- [預載] 絕美 PNG 背景圖 ---
    this.load.image('loading_bg', 'img/loading_bg.png');

    if (window.location.protocol !== 'file:') {
        this.load.audio('bgm_waterfall', 'audio/waterfall.mp3');
        this.load.audio('bgm_day', 'audio/wind_day.mp3');
        this.load.audio('bgm_night', 'audio/crickets_night.mp3');
    }
}

function create() {
    selfRef = this;
    this.input.addPointer(1);
    isBuildMode = true; // uses global (so HTML UI can read it)
    // Panel button tracking (buttons added directly to scene for reliable input)
    let dexPanelBtns = [], settingsPanelBtns = [], rosterPanelBtns = [], expedPanelBtns = [], shopPanelBtns = [];

    if (window.location.protocol !== 'file:') {
        soundWaterfall = this.sound.add('bgm_waterfall', { loop: true, volume: 0.1 });
        soundDay = this.sound.add('bgm_day', { loop: true, volume: 0.15 });
        soundNight = this.sound.add('bgm_night', { loop: true, volume: 0 }); 
    }

    // --- [載入畫面 — 旋轉櫻花 spinner + 進度條 + 自動進入] ---
    let loadScreen   = document.getElementById('loading-screen');
    let loadStatus   = document.getElementById('loading-status');
    let loadBarFill  = document.getElementById('loading-bar-fill');

    function setLoadProgress(pct, msg) {
        if (loadBarFill) loadBarFill.style.width = pct + '%';
        if (loadStatus)  loadStatus.textContent  = msg;
    }

    // 建立 CSS 櫻花與蒸氣粒子
    if (loadScreen) {
        for (let i = 0; i < 20; i++) {
            let p = document.createElement('div');
            p.className = 'loading-sakura';
            p.textContent = '🌸';
            p.style.left = (Math.random() * 110 - 5) + '%';
            p.style.animationDuration = (4 + Math.random() * 5) + 's';
            p.style.animationDelay  = -(Math.random() * 8) + 's';
            loadScreen.appendChild(p);
        }
        for (let i = 0; i < 8; i++) {
            let s = document.createElement('div');
            s.className = 'loading-steam';
            s.style.left   = (32 + Math.random() * 36) + '%';
            s.style.bottom = (22 + Math.random() * 22) + '%';
            s.style.animationDuration = (2 + Math.random() * 2.5) + 's';
            s.style.animationDelay    = -(Math.random() * 3) + 's';
            loadScreen.appendChild(s);
        }
    }
    setLoadProgress(10, '初始化中...');

    // ------------------------------------

    function generateNewMap() {
        // Fill everything with ocean
        for (let y = 0; y < gridSize; y++) {
            let row = [];
            for (let x = 0; x < gridSize; x++) {
                row.push({ status: -7, unlocked: false, isAdj: false });
            }
            mapData.push(row);
        }

        // Carve out each island (grid-space circle — reliable, large)
        islandDatabase.forEach(island => {
            let icx = centerGrid + island.cx;
            let icy = centerGrid + island.cy;
            let r = island.radius;
            for (let ty = Math.max(0, Math.floor(icy - r - 2)); ty <= Math.min(gridSize-1, Math.ceil(icy + r + 2)); ty++) {
                for (let tx = Math.max(0, Math.floor(icx - r - 2)); tx <= Math.min(gridSize-1, Math.ceil(icx + r + 2)); tx++) {
                    let dist = Math.sqrt(Math.pow(tx - icx, 2) + Math.pow(ty - icy, 2));
                    if (dist > r) continue;
                    let rand = Math.random();
                    let tileStatus = 0;
                    let isEdge = dist > r - 1.5;
                    if (!isEdge) {
                        if (rand < 0.04) tileStatus = -2;
                        else if (rand < 0.07) tileStatus = -3;
                    }
                    let isStartCenter = island.id === 0 && Math.abs(tx - icx) <= 20 && Math.abs(ty - icy) <= 20;
                    if (isStartCenter) tileStatus = 0;
                    mapData[ty][tx] = { status: tileStatus, unlocked: isStartCenter, isAdj: false };
                }
            }
        });

        // Convert rivers adjacent to mountains into waterfalls
        for (let y = 1; y < gridSize-1; y++) {
            for (let x = 1; x < gridSize-1; x++) {
                if (mapData[y][x].status === -3 && mapData[y-1][x].status === -2) mapData[y][x].status = -4;
            }
        }
        markOceanBorders();

        // Place expedition village tiles in open ocean at various distances/directions
        function placeVillage(targetX, targetY) {
            for (let r = 0; r <= 12; r++) {
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                        let nx = targetX + dx, ny = targetY + dy;
                        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && mapData[ny][nx].status === -7) {
                            mapData[ny][nx].status = -5;
                            return;
                        }
                    }
                }
            }
        }
        // 8 compass directions at ~310 tiles, plus 4 far villages at ~370 tiles (clear of all islands r=200)
        [
            [0, -310], [310, 0], [0, 310], [-310, 0],
            [220, -220], [220, 220], [-220, 220], [-220, -220],
            [370, -50], [-360, 60], [50, 370], [-60, -360],
        ].forEach(([dx, dy]) => placeVillage(centerGrid + dx, centerGrid + dy));

        updateAdjacency();
    }

    // Mark ocean tiles within 2 tiles of any island edge as -8 (rendered ocean border)
    // These cover the isometric staircase effect at island edges
    function markOceanBorders() {
        islandDatabase.forEach(island => {
            let icx = centerGrid + island.cx;
            let icy = centerGrid + island.cy;
            let r = island.radius;
            let outerR = r + 2;
            for (let ty = Math.max(0, Math.floor(icy - outerR - 1)); ty <= Math.min(gridSize-1, Math.ceil(icy + outerR + 1)); ty++) {
                for (let tx = Math.max(0, Math.floor(icx - outerR - 1)); tx <= Math.min(gridSize-1, Math.ceil(icx + outerR + 1)); tx++) {
                    if (mapData[ty][tx].status !== -7) continue;
                    let dist = Math.sqrt(Math.pow(tx - icx, 2) + Math.pow(ty - icy, 2));
                    if (dist <= outerR) mapData[ty][tx].status = -8;
                }
            }
        });
    }

    function loadGameData() {
        let savedDataStr = localStorage.getItem(SAVE_KEY);
        if (savedDataStr) {
            try {
                let data = JSON.parse(savedDataStr);
                tutorialStep = data.tutorialStep !== undefined ? data.tutorialStep : 0;
                score = data.score; premiumCoin = data.premiumCoin; playerLevel = data.playerLevel; playerExp = data.playerExp;
                questStats = data.questStats || { yokaiServed: 0, buildCount: 0, expandCount: 0, decorCount: 0 };
                currentQuest = data.currentQuest || currentQuest;
                ownedYokais = data.ownedYokais || [];
                unlockedIslands = data.unlockedIslands || [0];
                lastLoginDate  = data.lastLoginDate  || null;
                loginStreak    = data.loginStreak    || 0;
                lastFreeDrawDate = data.lastFreeDrawDate || null;
                gachaPity      = data.gachaPity      || 0;
                yokaiDatabase.forEach((y, i) => { if (data.dex[i]) { y.unlocked = data.dex[i].unlocked; y.affection = data.dex[i].affection; } });
                generateNewMap();
                (data.unlockedTiles || []).forEach(([x, y]) => { if (y >= 0 && y < gridSize && x >= 0 && x < gridSize) mapData[y][x].unlocked = true; });
                updateAdjacency();

                if (data.activeExpedition) {
                    let e = data.activeExpedition;
                    activeExpedition = { gx: e.gx, gy: e.gy, sx: e.sx, sy: e.sy, dist: e.dist, timeTotal: e.timeTotal, timeLeft: e.timeLeft, rewardAcorn: e.rewardAcorn, rewardGem: e.rewardGem, state: e.state, team: e.team };
                    activeExpedition.marker = selfRef.add.text(e.sx, e.sy-40, activeExpedition.state==='done'?'🎁':'🎒', {fontSize:'24px'}).setOrigin(0.5).setDepth(1600);
                    selfRef.tweens.add({ targets: activeExpedition.marker, y: e.sy-50, yoyo: true, repeat: -1, duration: 600 });
                }

                data.pools.forEach(p => {
                    let sx = offsetX + (p.x - p.y) * halfWidth, sy = offsetY + (p.x + p.y) * halfHeight;
                    let poolGraphics = selfRef.add.graphics().setDepth(p.x+p.y+0.1); 
                    drawPool(poolGraphics, sx, sy, p.lvl, p.state);
                    let pBar = selfRef.add.rectangle(sx, sy+35, 40, 6, 0xffffff).setDepth(1000).setVisible(p.state === 'building');
                    let barW = p.state === 'building' ? 40 * (1 - (p.timeLeft / p.total)) : 0;
                    let pFill = selfRef.add.rectangle(sx-20, sy+35, barW, 6, 0x55efc4).setOrigin(0, 0.5).setDepth(1001).setVisible(p.state === 'building');
                    let lvlTxt = selfRef.add.text(sx, sy + 35, 'Lv.'+p.lvl, { fontSize: '14px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(p.x+p.y + 0.2).setVisible(p.state === 'active');
                    let tTxt = selfRef.add.text(sx, sy + 45, p.timeLeft>0 ? Math.ceil(p.timeLeft)+'s' : '', { fontSize: '13px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(p.x+p.y + 0.2).setVisible(p.state === 'building');
                    
                    let pObj = { gridX: p.x, gridY: p.y, screenX: sx, screenY: sy, depthLevel: p.x+p.y, occupants: p.occ, reserved: p.res, maxOccupants: p.max, level: p.lvl, state: p.state, buildEndTime: Date.now() + (p.timeLeft*1000), totalBuildTime: p.total, timeLeft: p.timeLeft, graphics: poolGraphics, barBg: pBar, barFill: pFill, lvlText: lvlTxt, timeText: tTxt };
                    if (p.state === 'ready') {
                        pObj.readyIcon = selfRef.add.text(sx, sy - 30, '👆', { fontSize: '32px' }).setOrigin(0.5).setDepth(1001);
                        selfRef.tweens.add({ targets: pObj.readyIcon, y: sy - 45, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });
                    } else if (p.state === 'active' && userSettings.vfx) {
                        pObj.emitter = selfRef.add.particles(sx, sy+6, 'steamTexture', { speed:{min:5,max:20}, angle:{min:250,max:290}, scale:{start:0.5,end:1.5}, alpha:{start:0.6,end:0}, lifespan:2500, frequency:400, blendMode:'ADD' }).setDepth(p.x+p.y+0.05);
                    }
                    pools.push(pObj);
                });

                data.decors.forEach(d => {
                    let sx = offsetX + (d.x - d.y) * halfWidth, sy = offsetY + (d.x + d.y) * halfHeight;
                    let item = itemDatabase.find(i => i.id === d.id);
                    if (!item) return;

                    if (d.id === 'path') {
                        let pathG = selfRef.add.graphics().setDepth(d.x+d.y+0.05);
                        pathG.fillStyle(0x7f8c8d, 1); pathG.beginPath(); pathG.moveTo(sx, sy); pathG.lineTo(sx+halfWidth-4, sy+14); pathG.lineTo(sx, sy+28); pathG.lineTo(sx-halfWidth+4, sy+14); pathG.closePath(); pathG.fillPath();
                        decors.push({ itemId: d.id, graphics: pathG, light: null, gx: d.x, gy: d.y, isWall: false, level: 1 });
                    } else {
                        let renderEmoji = item.emoji;
                        if (d.isWall) { if (d.lvl === 2) renderEmoji = '🛡️'; else if (d.lvl === 3) renderEmoji = '🏰'; }
                        let obj = selfRef.add.text(sx, sy - 15, renderEmoji, { fontSize: '28px' }).setOrigin(0.5).setDepth(d.x+d.y+0.1);
                        
                        let light = null;
                        if (item.isLight || (d.isWall && d.lvl === 3)) {
                            light = selfRef.add.graphics().setDepth(d.x+d.y - 0.1).setVisible(nightOverlay.fillAlpha > 0);
                            light.fillStyle(item.lightColor || 0xbdc3c7, 0.4); light.fillCircle(sx, sy+16, d.isWall?30:40);
                        }
                        decors.push({ itemId: d.id, graphics: obj, light: light, gx: d.x, gy: d.y, isWall: d.isWall, level: d.lvl });
                    }
                });
                return true;
            } catch (e) { console.error("存檔解析失敗", e); return false; }
        }
        return false;
    }

    // 幕後生成地圖與讀檔，帶進度條
    this.time.delayedCall(100, () => {
        setLoadProgress(30, '讀取地圖...');
        if (!loadGameData()) {
            setLoadProgress(50, '生成島嶼...');
            generateNewMap();
            generateQuest();
        } else {
            // Apply ocean border fix to loaded saves (idempotent — safe to re-run)
            markOceanBorders();
        }
        setLoadProgress(70, '建立世界...');
        // Centre camera on main island and set scroll bounds so the player
        // can explore the main island without accidentally revealing far-off islands
        let cx = offsetX + (centerGrid - centerGrid) * halfWidth;
        let cy = offsetY + (centerGrid + centerGrid) * halfHeight;
        selfRef.cameras.main.centerOn(cx, cy);
        // Bounds large enough to encompass all 5 islands and village tiles
        selfRef.cameras.main.setBounds(cx - 18000, cy - 14000, 38000, 30000);
    });

    // 自動進入：載入完成後自動開始遊戲，不需玩家點擊
    function autoEnter() {
        isGameLoaded = true;
        updateUI();
        updateHTMLLang();
        checkDailyLogin();
        // Show fixed HTML buttons now that game is ready
        let htmlUi = document.getElementById('html-ui');
        if (htmlUi) htmlUi.style.display = 'block';
        if (activeExpedition) hShow('hbtn-exped', true);
        if (userSettings.music) {
            if (soundWaterfall && !soundWaterfall.isPlaying) soundWaterfall.play();
            if (soundDay && !soundDay.isPlaying) soundDay.play();
            if (soundNight && !soundNight.isPlaying) soundNight.play();
            syncRealTime();
        }
        if (loadScreen) {
            loadScreen.style.opacity = '0';
            setTimeout(() => { if (loadScreen && loadScreen.parentNode) loadScreen.parentNode.removeChild(loadScreen); }, 1000);
        }
    }

    this.time.delayedCall(900, () => { setLoadProgress(85, '妖怪就位中...'); });
    this.time.delayedCall(1400, () => { setLoadProgress(95, '溫泉加熱中...'); });
    this.time.delayedCall(1900, () => {
        setLoadProgress(100, '歡迎來到湯之谷！');
        this.time.delayedCall(500, () => { autoEnter(); });
    });

    function updateAdjacency() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                mapData[y][x].isAdj = false;
                if (!mapData[y][x].unlocked && mapData[y][x].status !== -7) {
                    let n = [{x:x,y:y-1},{x:x,y:y+1},{x:x-1,y:y},{x:x+1,y:y}];
                    for (let i of n) { if(i.x>=0 && i.x<gridSize && i.y>=0 && i.y<gridSize && mapData[i.y][i.x].unlocked) { mapData[y][x].isAdj = true; break; } }
                }
            }
        }
    }

    // Ocean background and night overlay — oversized (8000×5000) rects centred on screen
    // so they always cover the full canvas regardless of resize timing
    let W0 = this.scale.width, H0 = this.scale.height;
    let oceanBg = this.add.rectangle(W0 / 2, H0 / 2, 8000, 5000, 0x0652dd, 1).setDepth(-10).setScrollFactor(0).setOrigin(0.5, 0.5);

    for(let i=0; i<3000; i++) tilePool.push(this.add.sprite(0,0,'grass1').setVisible(false).setOrigin(0.5, 0));
    for(let i=0; i<3000; i++) fogPool.push(this.add.sprite(0,0,'fog').setVisible(false).setOrigin(0.5, 0.5));
    for(let i=0; i<150; i++) signPool.push(this.add.text(0,0,'💰', {fontSize:'16px'}).setVisible(false).setOrigin(0.5));
    for(let i=0; i<50; i++) villagePool.push(this.add.text(0,0,'🏯', {fontSize:'32px'}).setVisible(false).setOrigin(0.5));

    nightOverlay = this.add.rectangle(W0 / 2, H0 / 2, 8000, 5000, 0x0a3d62, 0).setDepth(1800).setScrollFactor(0).setOrigin(0.5, 0.5);

    // [模組化] 初始化天氣系統
    if (typeof WeatherSystem !== 'undefined') {
        WeatherSystem.init(selfRef);
    }

    // Display elements replaced by HTML overlay — keep objects invisible, logic stays intact
    uiScore    = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(2000).setScrollFactor(0).setVisible(false);
    uiPremium  = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(2000).setScrollFactor(0).setVisible(false);
    uiPlayerLvl= this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(2000).setScrollFactor(0).setVisible(false);
    uiTime     = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(2000).setScrollFactor(0).setVisible(false);
    btnTimeToggle = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    btnTimeToggle.on('pointerdown', () => { if(!isGameLoaded) return; if (timeMode==='auto') timeMode='day'; else if (timeMode==='day') timeMode='night'; else timeMode='auto'; syncRealTime(); });

    // uiMode, btnSettings, btnDex moved to HTML overlay — kept invisible here for internal routing
    uiMode = this.add.text(-9999, -9999, '', { fontSize: '16px' }).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    uiMode.on('pointerdown', () => {
        if(!isGameLoaded) return;
        isBuildMode = !isBuildMode;
        activeShopItem = null;
        hShow('hud-cancel', false);
        // Sync HTML build button colour
        let hBtn = document.getElementById('hbtn-build');
        if (hBtn) {
            hBtn.className = 'hbtn ' + (isBuildMode ? 'hbtn-green' : 'hbtn-red');
            hBtn.textContent = isBuildMode ? '🔨 建造/升級' : '🔧 升級模式';
        }
        updateUI();
    });

    btnSettings = this.add.text(-9999, -9999, '⚙️ Settings', { fontSize: '14px' }).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    btnSettings.on('pointerdown', () => { if(isGameLoaded) openSettings(); });

    let btnDex = this.add.text(-9999, -9999, '', { fontSize: '16px' }).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    btnDex.on('pointerdown', () => { if(isGameLoaded) openPokedex(); });

    // Quest, expedition, cancel, save — all replaced by HTML; Phaser objects kept invisible
    uiQuest        = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(2000).setScrollFactor(0).setVisible(false);
    uiExpedTracker = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    uiBuildCancel  = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setInteractive().setDepth(3000).setScrollFactor(0).setVisible(false);
    uiSaveSync     = this.add.text(-9999,-9999,'',{fontSize:'1px'}).setDepth(4000).setScrollFactor(0).setVisible(false);

    // Expedition collect / pan logic — called by HTML button via GameAPI.openExped()
    function doExpedAction() {
        if (!isGameLoaded) return;
        if (activeExpedition && activeExpedition.state === 'done') {
            score += activeExpedition.rewardAcorn; premiumCoin += activeExpedition.rewardGem;
            showFloatingText(selfRef.scale.width/2, selfRef.scale.height/2 - 60,
                `🎉\n+${activeExpedition.rewardAcorn}🌰\n+${activeExpedition.rewardGem}💎`, '#fbc531', '28px', true);
            selfRef.tweens.killTweensOf(activeExpedition.marker);
            activeExpedition.marker.destroy();
            activeExpedition.team.forEach(id => { let y = ownedYokais.find(oy => oy.id === id); if (y) y.state = 'idle'; });
            activeExpedition = null;
            hShow('hbtn-exped', false);
            updateUI();
        } else if (activeExpedition) {
            let vSx = offsetX + (activeExpedition.gx - activeExpedition.gy) * halfWidth;
            let vSy = offsetY + (activeExpedition.gx + activeExpedition.gy) * halfHeight;
            selfRef.cameras.main.pan(vSx, vSy, 800, 'Sine.easeInOut');
        }
    }

    function openSettings() {
        if (settingsPanel) {
            settingsPanel.destroy(true); settingsPanel = null;
            settingsPanelBtns.forEach(b => b.destroy()); settingsPanelBtns = [];
            return;
        }
        if (dexPanel) { dexPanel.destroy(true); dexPanel = null; dexPanelBtns.forEach(b=>b.destroy()); dexPanelBtns=[]; }
        if (rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; rosterPanelBtns.forEach(b=>b.destroy()); rosterPanelBtns=[]; }
        if (shopPanel && shopPanel.visible) { shopPanel.setVisible(false); shopPanelBtns.forEach(b=>b.setVisible(false)); }

        // Container holds ONLY non-interactive visuals
        let W = selfRef.scale.width, H = selfRef.scale.height;
        settingsPanel = selfRef.add.container(W/2, H/2).setDepth(4000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(0, 0, 420, 380, 0x2c3e50, 0.95).setStrokeStyle(4, 0xbdc3c7).setInteractive();
        let title = selfRef.add.text(0, -150, '⚙️ Settings', { fontSize: '24px', fill: '#fbc531', fontStyle: 'bold' }).setOrigin(0.5);
        let langLabel = selfRef.add.text(-170, -70, '🌐 Language:', { fontSize: '18px', fill: '#fff' });
        let muLabel  = selfRef.add.text(-170, -10, '🎵 Music:', { fontSize: '18px', fill: '#fff' });
        let sfxLabel = selfRef.add.text(-170,  50, '🔊 SFX:',   { fontSize: '18px', fill: '#fff' });
        let vfxLabel = selfRef.add.text(-170, 110, '✨ VFX:',   { fontSize: '18px', fill: '#fff' });
        let vfxDesc  = selfRef.add.text(0, 160, '* Disable VFX for better performance.', { fontSize: '14px', fill: '#b2bec3' }).setOrigin(0.5);
        settingsPanel.add([bg, title, langLabel, muLabel, sfxLabel, vfxLabel, vfxDesc]);
        settingsPanelBtns = [];

        // Interactive buttons at scene level, positions relative to screen center
        let cx = W/2, cy = H/2;
        let closeBtn = selfRef.add.text(cx + 170, cy - 150, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive().setDepth(4001).setScrollFactor(0);
        closeBtn.on('pointerdown', () => {
            if(settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; }
            settingsPanelBtns.forEach(b => b.destroy()); settingsPanelBtns = [];
        });
        settingsPanelBtns.push(closeBtn);

        let langBtn = selfRef.add.text(cx + 80, cy - 70, currentLang.toUpperCase(), { fontSize: '18px', fill: '#f1c40f', backgroundColor: '#34495e', padding:{x:15,y:8} }).setOrigin(0, 0.5).setInteractive().setDepth(4001).setScrollFactor(0);
        langBtn.on('pointerdown', () => {
            let idx = availableLangs.indexOf(currentLang);
            currentLang = availableLangs[(idx + 1) % availableLangs.length];
            userSettings.lang = currentLang;
            saveSettings();
            langBtn.setText(currentLang.toUpperCase());
            updateUI();
            updateHTMLLang();
            syncRealTime();
        });
        settingsPanelBtns.push(langBtn);

        function makeToggle(offY, key) {
            let btn = selfRef.add.text(cx + 80, cy + offY, userSettings[key] ? '✅ ON' : '❌ OFF', { fontSize: '18px', fill: '#fff', backgroundColor: userSettings[key] ? '#27ae60' : '#c0392b', padding:{x:15,y:8} }).setOrigin(0, 0.5).setInteractive().setDepth(4001).setScrollFactor(0);
            btn.on('pointerdown', () => {
                userSettings[key] = !userSettings[key];
                saveSettings();
                btn.setText(userSettings[key] ? '✅ ON' : '❌ OFF');
                btn.setBackgroundColor(userSettings[key] ? '#27ae60' : '#c0392b');
                applySettings();
            });
            settingsPanelBtns.push(btn);
        }
        makeToggle(-10, 'music');
        makeToggle(50, 'sfx');
        makeToggle(110, 'vfx');
    }

    function saveSettings() { localStorage.setItem('yokai_settings', JSON.stringify(userSettings)); }

    function applySettings() {
        if (userSettings.music) {
            if (soundWaterfall && !soundWaterfall.isPlaying) soundWaterfall.play();
            if (soundDay && !soundDay.isPlaying) soundDay.play();
            if (soundNight && !soundNight.isPlaying) soundNight.play();
            syncRealTime(); 
        } else {
            if (soundWaterfall) soundWaterfall.stop();
            if (soundDay) soundDay.stop();
            if (soundNight) soundNight.stop();
        }

        pools.forEach(p => {
            if (p.state === 'active') {
                if (userSettings.vfx) {
                    if (!p.emitter) {
                        p.emitter = selfRef.add.particles(p.screenX, p.screenY+6, 'steamTexture', { speed:{min:5,max:20}, angle:{min:250,max:290}, scale:{start:0.5,end:1.5}, alpha:{start:0.6,end:0}, lifespan:2500, frequency:400, blendMode:'ADD' }).setDepth(p.depthLevel+0.05);
                    } else { p.emitter.start(); p.emitter.visible = true; }
                } else { if (p.emitter) { p.emitter.stop(); p.emitter.visible = false; } }
            }
        });

        // [模組化] 同步天氣特效設定
        if (typeof WeatherSystem !== 'undefined') WeatherSystem.applySettings();
    }

    function openPokedex() {
        if (dexPanel) {
            dexPanel.destroy(true); dexPanel = null;
            dexPanelBtns.forEach(b => b.destroy()); dexPanelBtns = [];
            return;
        }
        if (rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; rosterPanelBtns.forEach(b=>b.destroy()); rosterPanelBtns=[]; }
        if (settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; settingsPanelBtns.forEach(b=>b.destroy()); settingsPanelBtns=[]; }
        let W = selfRef.scale.width, H = selfRef.scale.height;
        dexPanel = selfRef.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85).setInteractive();
        let title = selfRef.add.text(W/2, 50, t('btnDex'), { fontSize: '32px', fill: '#fbc531', fontStyle: 'bold' }).setOrigin(0.5);
        dexPanel.add([bg, title]);
        yokaiDatabase.forEach((yokai, index) => {
            let rowY = 120 + index * 90;
            let avatar = selfRef.add.text(200, rowY, yokai.unlocked ? yokai.emoji : '❓', { fontSize: '48px' }).setOrigin(0.5);
            let nameStr = yokai.unlocked ? yokai.name[currentLang] : '???';
            let descStr = yokai.unlocked ? (yokai.affection >= 3 ? yokai.lore[currentLang] : `(❤️ 3)`) : '...';
            let nameTxt = selfRef.add.text(250, rowY - 20, `${nameStr} [❤️ ${yokai.affection}/3]`, { fontSize: '20px', fill: '#55efc4', fontStyle: 'bold' });
            let descTxt = selfRef.add.text(250, rowY + 5, descStr, { fontSize: '14px', fill: '#b2bec3', wordWrap: { width: 450 } });
            dexPanel.add([avatar, nameTxt, descTxt]);
        });
        let closeBtn = selfRef.add.text(W - 40, 50, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive().setDepth(3001).setScrollFactor(0);
        closeBtn.on('pointerdown', () => {
            if(dexPanel) { dexPanel.destroy(true); dexPanel = null; }
            dexPanelBtns.forEach(b => b.destroy()); dexPanelBtns = [];
        });
        dexPanelBtns = [closeBtn];
    }

    function openRoster() {
        if (rosterPanel) {
            rosterPanel.destroy(true); rosterPanel = null;
            rosterPanelBtns.forEach(b => b.destroy()); rosterPanelBtns = [];
            return;
        }
        if (dexPanel) { dexPanel.destroy(true); dexPanel = null; dexPanelBtns.forEach(b=>b.destroy()); dexPanelBtns=[]; }
        if (settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; settingsPanelBtns.forEach(b=>b.destroy()); settingsPanelBtns=[]; }
        let W = selfRef.scale.width, H = selfRef.scale.height;
        rosterPanel = selfRef.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(W/2, H/2, W, H, 0x1a252f, 0.95).setInteractive();
        let title = selfRef.add.text(W/2, 50, '🎒 Roster', { fontSize: '32px', fill: '#ff9ff3', fontStyle: 'bold' }).setOrigin(0.5);
        rosterPanel.add([bg, title]);

        if (ownedYokais.length === 0) {
            rosterPanel.add(selfRef.add.text(W/2, H/2, 'Empty Roster.', { fontSize: '20px', fill: '#b2bec3', align: 'center', lineSpacing: 10 }).setOrigin(0.5));
        } else {
            ownedYokais.forEach((yokai, index) => {
                let col = index % 2; let row = Math.floor(index / 2);
                let cardX = 220 + col * 360; let cardY = 160 + row * 110;
                let cardBg = selfRef.add.rectangle(cardX, cardY, 340, 90, 0x34495e, 1).setStrokeStyle(2, yokai.rarity==='SSR' ? 0xf1c40f : (yokai.rarity==='SR' ? 0x9b59b6 : 0xbdc3c7));
                let avatar = selfRef.add.text(cardX - 120, cardY, yokai.emoji, { fontSize: '42px' }).setOrigin(0.5);
                let statusColor = yokai.state === 'expedition' ? '#e74c3c' : '#55efc4';
                let nameTxt = selfRef.add.text(cardX - 80, cardY - 20, `${yokai.name[currentLang]}`, { fontSize: '18px', fill: statusColor, fontStyle: 'bold' });
                let rarityTxt = selfRef.add.text(cardX + 110, cardY - 20, yokai.rarity, { fontSize: '18px', fill: yokai.rarity==='SSR' ? '#f1c40f' : '#fff', fontStyle: 'bold' });
                let traitTxt = selfRef.add.text(cardX - 80, cardY + 5, `✨ ${yokai.trait[currentLang]}`, { fontSize: '14px', fill: '#ffeaa7', wordWrap: { width: 220 } });
                rosterPanel.add([cardBg, avatar, nameTxt, rarityTxt, traitTxt]);
            });
        }
        let closeBtn = selfRef.add.text(W - 40, 50, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive().setDepth(3001).setScrollFactor(0);
        closeBtn.on('pointerdown', () => {
            if(rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; }
            rosterPanelBtns.forEach(b => b.destroy()); rosterPanelBtns = [];
        });
        rosterPanelBtns = [closeBtn];
    }

    function syncRealTime() {
        if (!btnTimeToggle) return;
        let isNightTime = false;
        let overlayAlpha = 0;
        if (timeMode === 'auto') {
            const now = new Date(); const hour = now.getHours(); const min = now.getMinutes().toString().padStart(2, '0');
            hText('hud-time', `🕐 ${hour}:${min}`);
            let tb = hEl('hbtn-time'); if (tb) { tb.textContent = t('timeAuto'); tb.style.background = '#34495e'; }
            if (hour >= 18 || hour < 6) { overlayAlpha = 0.7; isNightTime = true; }
            else if (hour === 17 || hour === 6) { overlayAlpha = 0.3; isNightTime = true; }
        } else if (timeMode === 'day') {
            hText('hud-time', '☀️ --:--');
            let tb = hEl('hbtn-time'); if (tb) { tb.textContent = t('timeDay'); tb.style.background = '#e67e22'; }
        } else if (timeMode === 'night') {
            hText('hud-time', '🌙 --:--');
            let tb = hEl('hbtn-time'); if (tb) { tb.textContent = t('timeNight'); tb.style.background = '#2c3e50'; }
            overlayAlpha = 0.7; isNightTime = true;
        }
        nightOverlay.fillAlpha = overlayAlpha;
        // Sync body + html + canvas background so everything outside canvas matches
        let bgColor = isNightTime
            ? (overlayAlpha >= 0.7 ? '#03153a' : '#062a5c')
            : '#0652dd';
        document.body.style.backgroundColor = bgColor;
        document.documentElement.style.backgroundColor = bgColor;
        let canvasEl = document.querySelector('canvas');
        if (canvasEl) canvasEl.style.backgroundColor = bgColor;
        decors.forEach(d => { if(d.light) d.light.setVisible(isNightTime); });
        decors.forEach(d => { if(d.isWall && d.level === 3 && d.light) d.light.setVisible(isNightTime); });

        if (userSettings.music && soundDay && soundNight) {
            if (isNightTime) {
                selfRef.tweens.add({ targets: soundDay, volume: 0, duration: 2000 });
                selfRef.tweens.add({ targets: soundNight, volume: 0.4, duration: 2000 });
            } else {
                selfRef.tweens.add({ targets: soundDay, volume: 0.4, duration: 2000 });
                selfRef.tweens.add({ targets: soundNight, volume: 0, duration: 2000 });
            }
        }
    }
    this.time.addEvent({ delay: 1000, loop: true, callback: syncRealTime });
    syncRealTime();

    this.time.addEvent({ delay: 5000, loop: true, callback: () => {
        if (!isGameLoaded) return;
        hShow('hud-save', true);
        let saveData = {
            tutorialStep: tutorialStep,
            score: score, premiumCoin: premiumCoin, playerLevel: playerLevel, playerExp: playerExp, questStats: questStats, currentQuest: currentQuest, ownedYokais: ownedYokais, unlockedIslands: unlockedIslands,
            lastLoginDate, loginStreak, lastFreeDrawDate, gachaPity,
            dex: yokaiDatabase.map(y => ({ unlocked: y.unlocked, affection: y.affection })),
            unlockedTiles: (() => { let coords = []; for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) if (mapData[y][x].unlocked) coords.push([x, y]); return coords; })(),
            pools: pools.map(p => ({ x: p.gridX, y: p.gridY, lvl: p.level, state: p.state, timeLeft: p.timeLeft, total: p.totalBuildTime, occ: p.occupants, res: p.reserved, max: p.maxOccupants })),
            decors: decors.map(d => ({ id: d.itemId, x: d.gx, y: d.gy, lvl: d.level, isWall: d.isWall })),
            activeExpedition: activeExpedition ? { gx: activeExpedition.gx, gy: activeExpedition.gy, sx: activeExpedition.sx, sy: activeExpedition.sy, dist: activeExpedition.dist, timeTotal: activeExpedition.timeTotal, timeLeft: activeExpedition.timeLeft, rewardAcorn: activeExpedition.rewardAcorn, rewardGem: activeExpedition.rewardGem, state: activeExpedition.state, team: activeExpedition.team } : null
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        selfRef.time.delayedCall(1000, () => hShow('hud-save', false));
    }});

    function showGuideFinger() {
        if (guideFinger) { 
            selfRef.tweens.killTweensOf(guideFinger); 
            guideFinger.destroy(); 
        }
        let targetX = 480, targetY = 270;
        if (tutorialStep === 1) { targetX = 860; targetY = 80; }
        guideFinger = selfRef.add.text(targetX, targetY, '👇', { fontSize: '48px' }).setOrigin(0.5).setDepth(5000).setScrollFactor(0);
        selfRef.tweens.add({ targets: guideFinger, y: targetY - 20, yoyo: true, repeat: -1, duration: 400, ease: 'Sine.easeInOut' });
    }

    function generateQuest() {
        const tutorialQuests = [
            { type: 'build', target: 1, desc: '點擊空地，蓋第一座溫泉', reward: 50, premium: 0 },
            { type: 'decor', target: 1, desc: '點【🛒商店】，買石板路鋪設', reward: 50, premium: 0 },
            { type: 'serve', target: 1, desc: '等妖怪來泡！點頭頂的🍡/🍼', reward: 100, premium: 2 },
            { type: 'build', target: 2, desc: '存錢再蓋一座溫泉 (2座)', reward: 150, premium: 3 },
            { type: 'expand', target: 1, desc: '點迷霧旁的【💰】解鎖領地', reward: 200, premium: 5 }
        ];

        if (tutorialStep < tutorialQuests.length) {
            currentQuest = tutorialQuests[tutorialStep];
            showGuideFinger(); 
        } else {
            if (guideFinger) { 
                selfRef.tweens.killTweensOf(guideFinger); 
                guideFinger.destroy(); 
                guideFinger = null; 
            }
            let types = ['serve', 'build', 'expand']; let type = Phaser.Utils.Array.GetRandom(types);
            let target, desc, reward, premium;
            if (type === 'serve') { target = 5+playerLevel*2; questStats.yokaiServed = 0; desc = `接待 ${target} 妖怪 (${questStats.yokaiServed}/${target})`; reward = 100*playerLevel; premium = 0; } 
            else if (type === 'build') { target = questStats.buildCount+1; desc = `啟用新溫泉 (${questStats.buildCount}/${target})`; reward = 200*playerLevel; premium = 2; } 
            else { target = questStats.expandCount+3; desc = `購新地 (${questStats.expandCount}/${target})`; reward = 500*playerLevel; premium = 5; }
            currentQuest = { type, target, desc, reward, premium }; 
        }
        updateUI();
    }

    selfRef.addExp = function(amount) {
        playerExp += amount; let req = getExpRequired(playerLevel);
        if (playerExp >= req) {
            playerExp -= req; playerLevel++;
            selfRef.cameras.main.flash(300, 85, 239, 196, 0.3);
            showFloatingText(480, 270, '🎉 升級 Lv' + playerLevel, '#55efc4', '32px', true);
            // Check if any island unlocks at this level
            islandDatabase.forEach(island => {
                if (island.id !== 0 && !unlockedIslands.includes(island.id) && playerLevel >= island.requiredLevel) {
                    unlockedIslands.push(island.id);
                    let icx = centerGrid + island.cx;
                    let icy = centerGrid + island.cy;
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            let tx = icx + dx, ty = icy + dy;
                            if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize && mapData[ty][tx].status !== -7) {
                                mapData[ty][tx].unlocked = true;
                            }
                        }
                    }
                    updateAdjacency();
                    let islandName = island.name[currentLang] || island.name.en;
                    selfRef.time.delayedCall(800, () => {
                        showFloatingText(480, 200, '🏝️ ' + islandName + ' 解鎖！', '#74b9ff', '28px', true);
                        selfRef.cameras.main.flash(500, 116, 185, 255, 0.4);
                    });
                }
            });
        }
        updateUI();
    };

    function updateUI() {
        if (!currentQuest) return;
        // --- HTML HUD updates (fixed overlay, immune to camera zoom) ---
        hText('v-score', score.toLocaleString());
        hText('v-gems',  premiumCoin);
        hText('hud-lvl', `${t('lvl')} ${playerLevel}  (EXP: ${playerExp} / ${getExpRequired(playerLevel)})`);
        let questTxt = currentQuest.type === 'serve'  ? `📜 任務 (${questStats.yokaiServed}/${currentQuest.target})` :
                       currentQuest.type === 'build'  ? `📜 任務 (${questStats.buildCount}/${currentQuest.target})` :
                                                         `📜 ${currentQuest.desc}`;
        hText('hud-quest', questTxt);
        // Build button: colour + label
        let hBld = hEl('hbtn-build');
        if (hBld) {
            if (activeShopItem) { hBld.textContent = `🪑 ${activeShopItem.name[currentLang]}`; hBld.className = 'hbtn hbtn-purple'; }
            else { hBld.textContent = isBuildMode ? '🔨 建造/升級' : '🔧 升級模式'; hBld.className = 'hbtn ' + (isBuildMode ? 'hbtn-green' : 'hbtn-red'); }
        }
    }

    selfRef.checkQuests = function() {
        if (!currentQuest) return;
        let done = false;
        if (currentQuest.type==='serve' && questStats.yokaiServed >= currentQuest.target) done=true;
        if (currentQuest.type==='build' && questStats.buildCount >= currentQuest.target) done=true;
        if (currentQuest.type==='expand' && questStats.expandCount >= currentQuest.target) done=true;
        if (currentQuest.type==='decor' && questStats.decorCount >= currentQuest.target) done=true; 

        if (done) { 
            score += currentQuest.reward; premiumCoin += currentQuest.premium; 
            selfRef.addExp(currentQuest.reward); 
            showFloatingText(480, 100, `🌟 任務完成！+${currentQuest.reward}🌰`, '#ff9ff3', '24px', true);
            if (tutorialStep < 5) tutorialStep++; 
            selfRef.time.delayedCall(1000, generateQuest); 
        } else { updateUI(); }
    };

    selfRef.cameras.main.setZoom(1.5);

    cursor = this.add.graphics().lineStyle(2, 0xffeaa7, 0.8).setDepth(1600).setVisible(false);
    cursor.beginPath(); cursor.moveTo(0, 0); cursor.lineTo(halfWidth, 16); cursor.lineTo(0, 32); cursor.lineTo(-halfWidth, 16); cursor.closePath(); cursor.strokePath();

    let pinchStartDist = -1; let initialZoom = 1; let pointerDownPos = { x: 0, y: 0 }; let lastDragGrid = { x: -1, y: -1 };
    let lastPanX = -1, lastPanY = -1; // manual prev-position tracking (p.prevPosition unreliable on mobile)

    function attemptPlaceItem(p) {
        // No pixel-space guards needed — UI is now in the HTML overlay which intercepts its own clicks

        let tapIsoX = (p.worldX - offsetX) / halfWidth; let tapIsoY = (p.worldY - offsetY) / halfHeight;
        let clickGx = Math.floor((tapIsoY + tapIsoX) / 2); let clickGy = Math.floor((tapIsoY - tapIsoX) / 2);
        if (clickGx < 0 || clickGx >= gridSize || clickGy < 0 || clickGy >= gridSize) return;
        if (lastDragGrid.x === clickGx && lastDragGrid.y === clickGy) return; 

        let tile = mapData[clickGy][clickGx];
        if (!tile.unlocked || tile.status !== 0) return; 
        if (pools.some(pool => pool.gridX === clickGx && pool.gridY === clickGy) || decors.some(d => d.gx === clickGx && d.gy === clickGy)) return; 

        let canAfford = false;
        if (activeShopItem.currency === 'FREE') canAfford = true;
        else if (activeShopItem.currency === 'ACORN' && score >= activeShopItem.price) { score -= activeShopItem.price; canAfford = true; }
        else if (activeShopItem.currency === 'GEM' && premiumCoin >= activeShopItem.price) { premiumCoin -= activeShopItem.price; canAfford = true; }

        let sx = offsetX + (clickGx - clickGy) * halfWidth, sy = offsetY + (clickGx + clickGy) * halfHeight;

        if (canAfford) {
            lastDragGrid = { x: clickGx, y: clickGy }; updateUI();
            let renderY = sy - 15; 
            if(activeShopItem.id === 'path') {
                let pathG = selfRef.add.graphics().setDepth(clickGx+clickGy+0.05);
                pathG.fillStyle(0x7f8c8d, 1); pathG.beginPath(); pathG.moveTo(sx, sy); pathG.lineTo(sx+halfWidth-4, sy+14); pathG.lineTo(sx, sy+28); pathG.lineTo(sx-halfWidth+4, sy+14); pathG.closePath(); pathG.fillPath();
                decors.push({ itemId: activeShopItem.id, graphics: pathG, light: null, gx: clickGx, gy: clickGy, isWall: false, level: 1 });
            } else {
                let obj = selfRef.add.text(sx, renderY, activeShopItem.emoji, { fontSize: '28px' }).setOrigin(0.5).setDepth(clickGx+clickGy+0.1);
                let light = null;
                if (activeShopItem.isLight) {
                    light = selfRef.add.graphics().setDepth(clickGx+clickGy - 0.1).setVisible(nightOverlay.fillAlpha > 0);
                    light.fillStyle(activeShopItem.lightColor, 0.4); light.fillCircle(sx, sy+16, 40);
                }
                decors.push({ itemId: activeShopItem.id, graphics: obj, light: light, gx: clickGx, gy: clickGy, isWall: activeShopItem.isWall, level: 1 });
            }
            questStats.decorCount++;
            selfRef.checkQuests();
        } else { activeShopItem = null; hShow('hud-cancel', false); showFloatingText(p.worldX, p.worldY, '資金不足', '#ff7675'); }
    }

    this.input.on('pointerdown', (p) => {
        if(!isGameLoaded) return;
        pointerDownPos.x = p.x; pointerDownPos.y = p.y; lastDragGrid = { x: -1, y: -1 };
        lastPanX = p.x; lastPanY = p.y; // seed pan tracker
        if (activeShopItem && (!dexPanel && !settingsPanel && (!shopPanel || !shopPanel.visible) && !rosterPanel && !expedPanel)) attemptPlaceItem(p);
    });

    this.input.on('pointermove', function (p) {
        if(!isGameLoaded) return;
        let isoX = (p.worldX - offsetX) / halfWidth, isoY = (p.worldY - offsetY) / halfHeight;
        let gx = Math.floor((isoY + isoX) / 2), gy = Math.floor((isoY - isoX) / 2);
        if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) { cursor.setVisible(true); cursor.setPosition(offsetX + (gx-gy)*halfWidth, offsetY + (gx+gy)*halfHeight - 16); } else { cursor.setVisible(false); }

        if (selfRef.input.pointer1.isDown && selfRef.input.pointer2.isDown) {
            let dist = Phaser.Math.Distance.Between(selfRef.input.pointer1.x, selfRef.input.pointer1.y, selfRef.input.pointer2.x, selfRef.input.pointer2.y);
            if (pinchStartDist === -1) { pinchStartDist = dist; initialZoom = selfRef.cameras.main.zoom; } 
            else { let scale = dist / pinchStartDist; selfRef.cameras.main.setZoom(Phaser.Math.Clamp(initialZoom * scale, 0.7, 3.0)); }
        } else if (p.isDown) {
            if (activeShopItem) { attemptPlaceItem(p); }
            else {
                pinchStartDist = -1;
                if (lastPanX !== -1) {
                    let dx = p.x - lastPanX, dy = p.y - lastPanY;
                    selfRef.cameras.main.scrollX -= dx / selfRef.cameras.main.zoom;
                    selfRef.cameras.main.scrollY -= dy / selfRef.cameras.main.zoom;
                }
                lastPanX = p.x; lastPanY = p.y;
            }
        } else { pinchStartDist = -1; lastPanX = -1; lastPanY = -1; }
    });

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        if(!isGameLoaded) return;
        let cam = selfRef.cameras.main;
        let oldZoom = cam.zoom;
        let newZoom = Phaser.Math.Clamp(oldZoom - (deltaY * 0.001), 0.7, 3.0);
        if (newZoom === oldZoom) return;
        // Anchor zoom to pointer world position so map doesn't drift right
        let wx = cam.scrollX + pointer.x / oldZoom;
        let wy = cam.scrollY + pointer.y / oldZoom;
        cam.setZoom(newZoom);
        cam.scrollX = wx - pointer.x / newZoom;
        cam.scrollY = wy - pointer.y / newZoom;
    });

    this.input.on('pointerup', function (p) {
        if(!isGameLoaded) return;
        pinchStartDist = -1; lastDragGrid = { x: -1, y: -1 }; lastPanX = -1; lastPanY = -1;
        // Scale drag-rejection threshold with zoom: at zoom=3 a 5-world-pixel tremor = 15 screen px → wrongly rejected.
        // Use world-space distance so tolerance stays ~12 world pixels regardless of zoom level.
        let zoom = selfRef.cameras.main.zoom;
        let dragThresh = 12 * zoom;
        if (activeShopItem || Math.abs(p.x - p.downX) > dragThresh || Math.abs(p.y - p.downY) > dragThresh) return;
        if (dexPanel || rosterPanel || settingsPanel || expedPanel || (shopPanel && shopPanel.visible)) return; 
        // No pixel-space guards — UI is HTML overlay, canvas receives only game-area clicks
        let tapIsoX = (p.worldX - offsetX) / halfWidth; let tapIsoY = (p.worldY - offsetY) / halfHeight;
        let clickGx = Math.floor((tapIsoY + tapIsoX) / 2); let clickGy = Math.floor((tapIsoY - tapIsoX) / 2);

        let exactPool = null;
        for (let pool of pools) {
            let hitY = pool.state === 'ready' ? pool.screenY - 15 : pool.screenY + 16; 
            if (Phaser.Math.Distance.Between(p.worldX, p.worldY, pool.screenX, hitY) < 35) { exactPool = pool; break; }
        }
        if (exactPool) { clickGx = exactPool.gridX; clickGy = exactPool.gridY; }

        if (clickGx < 0 || clickGx >= gridSize || clickGy < 0 || clickGy >= gridSize) return;
        let tile = mapData[clickGy][clickGx]; let sx = offsetX + (clickGx - clickGy) * halfWidth, sy = offsetY + (clickGx + clickGy) * halfHeight;

        if (tile.status === -7) { showFloatingText(p.worldX, p.worldY, '🌊 茫茫大海...', '#74b9ff'); return; }
        if (tile.status === -6) { showFloatingText(p.worldX, p.worldY, '這是萬丈懸崖！', '#b2bec3'); return; }

        if (tile.status === -5) {
            if (activeExpedition && activeExpedition.state !== 'done') { showFloatingText(p.worldX, p.worldY, '已有隊伍在外！', '#ff7675'); return; }
            let dist = Math.floor(Math.sqrt(Math.pow(clickGx-centerGrid, 2) + Math.pow(clickGy-centerGrid, 2))); 
            let baseTime = dist * 8; let baseAcorn = dist * 200; let baseGem = Math.floor(dist / 3);
            let selectedTeam = []; let available = ownedYokais.filter(y => y.state === 'idle');

            expedPanel = selfRef.add.container(480, 270).setDepth(3000).setScrollFactor(0);
            let eBg = selfRef.add.rectangle(0, 0, 500, 380, 0x34495e, 0.95).setStrokeStyle(4, 0x9b59b6).setInteractive();
            let eTitle = selfRef.add.text(0, -160, '🏯 遠方村莊', { fontSize: '24px', fill: '#fbc531', fontStyle: 'bold' }).setOrigin(0.5);
            let statsText = selfRef.add.text(0, -100, '', { fontSize: '18px', fill: '#fff', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
            let subtitle = selfRef.add.text(0, -35, '👇 選擇出戰隊員 👇', { fontSize: '16px', fill: '#bdc3c7' }).setOrigin(0.5);
            expedPanel.add([eBg, eTitle, statsText, subtitle]);
            expedPanelBtns = [];

            function updateExpedStats() {
                let tMult = 1.0, aMult = 1.0, gMult = 1.0;
                selectedTeam.forEach(y => {
                    if(y.id===0) gMult+=0.15;
                    if(y.id===1) tMult-=0.20;
                    if(y.id===2) aMult+=0.30;
                    if(y.id===3) { aMult+=0.10; tMult-=0.10; }
                    if(y.id===4) { aMult+=0.20; gMult+=0.10; } // 櫻花精
                    if(y.id===5) { aMult+=0.15; tMult-=0.15; } // 玄武龜
                    if(y.id===6) { aMult+=0.25; gMult+=0.15; } // 雷獅 SSR
                    if(y.id===7) gMult+=0.20;                   // 月兔
                    if(y.id===8) aMult+=0.10;                   // 蘑菇精
                    if(y.id===9) tMult-=0.15;                   // 海龍童子
                });
                let fTime = Math.max(1, Math.floor(baseTime * tMult)); let fAcorn = Math.floor(baseAcorn * aMult); let fGem = Math.floor(baseGem * gMult);
                statsText.setText(`距離: ${dist} km\n預計時間: ${fTime} 秒\n預計掉落: ${fAcorn}🌰 / ${fGem}💎`);
                return { fTime, fAcorn, fGem };
            }
            updateExpedStats();

            function closeExpedPanel() {
                if(expedPanel) { expedPanel.destroy(); expedPanel = null; }
                expedPanelBtns.forEach(b => b.destroy()); expedPanelBtns = [];
            }

            // Yokai selection cards - scene level
            if (available.length === 0) {
                expedPanel.add(selfRef.add.text(0, 30, '無待命中的夥伴', { fontSize: '16px', fill: '#e74c3c' }).setOrigin(0.5));
            } else {
                available.forEach((y, idx) => {
                    let screenX = 480 + (-180 + idx * 80); let screenY = 300;
                    let card = selfRef.add.rectangle(screenX, screenY, 60, 60, 0x2c3e50, 1).setStrokeStyle(2, 0xbdc3c7).setInteractive().setDepth(3001).setScrollFactor(0);
                    let icon = selfRef.add.text(screenX, screenY, y.emoji, { fontSize: '32px' }).setOrigin(0.5).setDepth(3001).setScrollFactor(0);
                    card.on('pointerdown', () => {
                        let fIdx = selectedTeam.findIndex(sy => sy.id === y.id);
                        if (fIdx > -1) { selectedTeam.splice(fIdx, 1); card.setFillStyle(0x2c3e50); card.setStrokeStyle(2, 0xbdc3c7); }
                        else if (selectedTeam.length < 3) { selectedTeam.push(y); card.setFillStyle(0x27ae60); card.setStrokeStyle(3, 0x55efc4); }
                        updateExpedStats();
                    });
                    expedPanelBtns.push(card, icon);
                });
            }

            // Yes/No buttons - scene level
            let eBtnYes = selfRef.add.text(380, 400, '[ 派遣出發 ]', { fontSize: '20px', fill: '#55efc4', backgroundColor: '#27ae60', padding: {x:15,y:8} }).setOrigin(0.5).setInteractive().setDepth(3001).setScrollFactor(0);
            let eBtnNo  = selfRef.add.text(580, 400, '[ 放棄 ]',    { fontSize: '20px', fill: '#ff7675', backgroundColor: '#c0392b', padding: {x:15,y:8} }).setOrigin(0.5).setInteractive().setDepth(3001).setScrollFactor(0);
            eBtnNo.on('pointerdown', () => { closeExpedPanel(); });
            eBtnYes.on('pointerdown', () => {
                let finalData = updateExpedStats();
                selectedTeam.forEach(y => { y.state = 'expedition'; });
                activeExpedition = { gx: clickGx, gy: clickGy, sx: sx, sy: sy, dist: dist, timeTotal: finalData.fTime, timeLeft: finalData.fTime, rewardAcorn: finalData.fAcorn, rewardGem: finalData.fGem, state: 'exploring', team: selectedTeam.map(y=>y.id), marker: selfRef.add.text(sx, sy-40, '🎒', {fontSize:'24px'}).setOrigin(0.5).setDepth(1600) };
                selfRef.tweens.add({ targets: activeExpedition.marker, y: sy-50, yoyo: true, repeat: -1, duration: 600 });
                hShow('hbtn-exped', true); showFloatingText(selfRef.scale.width/2, selfRef.scale.height/2, `探索隊出發！`, '#a29bfe', '24px', true);
                closeExpedPanel(); updateUI();
            });
            expedPanelBtns.push(eBtnYes, eBtnNo);
            return;
        }

        if (!tile.unlocked) {
            if (tile.isAdj) {
                let cost = getTileExpandCost(questStats.expandCount);
                if (score >= cost) {
                    score -= cost; tile.unlocked = true; questStats.expandCount++; updateAdjacency(); 
                    selfRef.cameras.main.flash(200, 255, 255, 255, 0.2); 
                    showFloatingText(p.worldX, p.worldY, '解鎖領地！', '#55efc4'); selfRef.addExp(50); selfRef.checkQuests();
                } else { showFloatingText(p.worldX, p.worldY, `擴張需 ${cost} 🌰`, '#ff7675'); }
            } else { showFloatingText(p.worldX, p.worldY, '需與領地相鄰', '#b2bec3'); }
            return; 
        }

        let status = tile.status;
        let targetPool = exactPool; 
        if (!targetPool) { let pIndex = pools.findIndex(pool => pool.gridX === clickGx && pool.gridY === clickGy); targetPool = pIndex > -1 ? pools[pIndex] : null; }

        if (isBuildMode) {
            let dIndex = decors.findIndex(d => d.gx === clickGx && d.gy === clickGy);
            if (dIndex > -1) {
                let d = decors[dIndex];
                if (d.isWall) {
                    if (d.level === 1 && score >= 100) { score -= 100; d.level = 2; d.graphics.setText('🛡️'); showFloatingText(p.worldX, p.worldY, '升級圍欄', '#f1c40f'); } 
                    else if (d.level === 2 && premiumCoin >= 5) { premiumCoin -= 5; d.level = 3; d.graphics.setText('🏰'); showFloatingText(p.worldX, p.worldY, '升級城牆', '#81ecec'); d.light = selfRef.add.graphics().setDepth(clickGx+clickGy - 0.1).setVisible(nightOverlay.fillAlpha > 0); d.light.fillStyle(0xbdc3c7, 0.3); d.light.fillCircle(sx, sy+16, 30); } 
                    else if (d.level === 1) { showFloatingText(p.worldX, p.worldY, '需 100 🌰', '#ff7675'); } 
                    else if (d.level === 2) { showFloatingText(p.worldX, p.worldY, '需 5 💎', '#ff7675'); }
                    updateUI();
                }
                return; 
            }
        }

        if (status === -1 || status === -2 || status === -3 || status === -4) return;

        if (isBuildMode) {
            if (targetPool && targetPool.state === 'waiting_upgrade') {
                if (targetPool.occupants === 0 && targetPool.reserved === 0) { startUpgrade(targetPool, targetPool.nextLevel); }
                else { showFloatingText(p.worldX, p.worldY, '工程排程中', '#f1c40f'); }
                return;
            }
            if (targetPool && targetPool.state === 'waiting_demolish') { showFloatingText(p.worldX, p.worldY, '工程排程中', '#f1c40f'); return; }
            if (targetPool && targetPool.state === 'ready') {
                targetPool.state = 'active'; 
                if(targetPool.readyIcon) { 
                    selfRef.tweens.killTweensOf(targetPool.readyIcon); 
                    targetPool.readyIcon.destroy(); 
                    targetPool.readyIcon = null; 
                }
                drawPool(targetPool.graphics, sx, sy, targetPool.level, 'active'); targetPool.lvlText.setText('Lv.' + targetPool.level).setVisible(true); 
                if (userSettings.vfx) {
                    if (!targetPool.emitter) { targetPool.emitter = selfRef.add.particles(sx, sy+6, 'steamTexture', { speed:{min:5,max:20}, angle:{min:250,max:290}, scale:{start:0.5,end:1.5}, alpha:{start:0.6,end:0}, lifespan:2500, frequency:400, blendMode:'ADD' }).setDepth(targetPool.depthLevel+0.05); } else { targetPool.emitter.start(); targetPool.emitter.visible = true; }
                }
                let expGain = targetPool.level * 50; selfRef.addExp(expGain); questStats.buildCount++; selfRef.checkQuests();
                showFloatingText(p.worldX, p.worldY, `✨ 啟用！(+${expGain}EXP)`, '#55efc4'); return; 
            }
            if (targetPool && targetPool.state === 'building') {
                let skipCost = Math.ceil(targetPool.timeLeft / 10); 
                if (premiumCoin >= skipCost) { premiumCoin -= skipCost; targetPool.buildEndTime = Date.now(); showFloatingText(p.worldX, p.worldY, `⏩ 加速 (-${skipCost}💎)`, '#81ecec'); updateUI(); } 
                return; 
            }
            let nextLevel = status + 1; 
            if (nextLevel > 10) return;
            let requiredLv = unlockLevels[nextLevel];
            if (playerLevel < requiredLv) { showFloatingText(p.worldX, p.worldY, `需老闆Lv.${requiredLv}解鎖!`, '#ff7675'); return; }

            let cost = getCost(nextLevel);
            if (score >= cost) {
                score -= cost; updateUI(); 
                if(status === 0) {
                    tile.status = nextLevel;
                    let buildDuration = getBuildTime(nextLevel); let endTime = Date.now() + (buildDuration*1000);
                    let poolGraphics = selfRef.add.graphics().setDepth(clickGx+clickGy+0.1); drawPool(poolGraphics, sx, sy, 1, 'building');
                    let pBar = selfRef.add.rectangle(sx, sy+35, 40, 6, 0xffffff).setDepth(1000);
                    let pFill = selfRef.add.rectangle(sx-20, sy+35, 0, 6, 0x55efc4).setOrigin(0, 0.5).setDepth(1001);
                    let lvlTxt = selfRef.add.text(sx, sy + 35, 'Lv.1', { fontSize: '14px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(clickGx+clickGy + 0.2).setVisible(false);
                    let tTxt = selfRef.add.text(sx, sy + 45, '', { fontSize: '13px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(clickGx+clickGy + 0.2);
                    pools.push({ gridX: clickGx, gridY: clickGy, screenX: sx, screenY: sy, depthLevel: clickGx+clickGy, occupants: 0, reserved: 0, maxOccupants: getCapacity(1), level: 1, state: 'building', buildEndTime: endTime, totalBuildTime: buildDuration, graphics: poolGraphics, barBg: pBar, barFill: pFill, lvlText: lvlTxt, timeText: tTxt });
                    showFloatingText(p.worldX, p.worldY, '施工🚧', '#f39c12');
                } else {
                    if (targetPool.occupants > 0 || targetPool.reserved > 0) { targetPool.state = 'waiting_upgrade'; targetPool.nextLevel = nextLevel; showFloatingText(p.worldX, p.worldY, '⏳ 預約升級', '#f1c40f');
                    } else { startUpgrade(targetPool, nextLevel); }
                }
            } else { showFloatingText(p.worldX, p.worldY, `需 ${cost} 🌰`, '#ff7675'); }
        } else {
            if (targetPool) {
                if (targetPool.state === 'waiting_upgrade' || targetPool.state === 'waiting_demolish') { showFloatingText(p.worldX, p.worldY, '工程排程中', '#f1c40f'); return; }
                if (targetPool.occupants > 0 || targetPool.reserved > 0) { targetPool.state = 'waiting_demolish'; showFloatingText(p.worldX, p.worldY, '⏳ 預約拆除', '#e74c3c');
                } else { executeDemolish(targetPool); }
            } else {
                let dIndex = decors.findIndex(d => d.gx === clickGx && d.gy === clickGy);
                if (dIndex > -1) {
                    let d = decors[dIndex]; d.graphics.destroy(); if(d.light) d.light.destroy();
                    decors.splice(dIndex, 1); showFloatingText(p.worldX, p.worldY, `💥 拆除`, '#b2bec3');
                }
            }
        }
    });

    function drawPool(graphics, sx, sy, level, state) {
        graphics.clear();
        if (state === 'building' || state === 'ready') {
            graphics.fillStyle(0xd35400, 1); graphics.fillRect(sx-15, sy+1, 30, 30); graphics.lineStyle(2, 0xe67e22, 1); graphics.strokeRect(sx-15, sy+1, 30, 30); return;
        }
        let c = poolColors[level] || poolColors[1]; let v = 1 + (level * 0.05); 
        graphics.fillStyle(0x7f8c8d, 1); graphics.beginPath(); graphics.moveTo(sx, sy+16); graphics.lineTo(sx+halfWidth*v, sy+32); graphics.lineTo(sx, sy+48); graphics.lineTo(sx-halfWidth*v, sy+32); graphics.closePath(); graphics.fillPath();
        graphics.fillStyle(0x34495e, 1); graphics.beginPath(); graphics.moveTo(sx-halfWidth*v, sy+32); graphics.lineTo(sx, sy+48); graphics.lineTo(sx, sy+56); graphics.lineTo(sx-halfWidth*v, sy+40); graphics.closePath(); graphics.fillPath();
        graphics.fillStyle(0x2c3e50, 1); graphics.beginPath(); graphics.moveTo(sx, sy+48); graphics.lineTo(sx+halfWidth*v, sy+32); graphics.lineTo(sx+halfWidth*v, sy+40); graphics.lineTo(sx, sy+56); graphics.closePath(); graphics.fillPath();
        sy += 12; 
        graphics.fillStyle(c.w, 0.9); graphics.beginPath(); graphics.moveTo(sx, sy); graphics.lineTo(sx+halfWidth*v*0.8, sy+16); graphics.lineTo(sx, sy+32); graphics.lineTo(sx-halfWidth*v*0.8, sy+16); graphics.closePath(); graphics.fillPath();
    }

    shopPanel = this.add.container(this.scale.width/2, this.scale.height/2).setDepth(3000).setScrollFactor(0).setVisible(false);
    let shopBg = this.add.rectangle(0, 0, 600, 450, 0x2d3436, 0.95).setStrokeStyle(4, 0xf39c12).setInteractive();
    shopPanel.add([shopBg, this.add.text(0, -190, t('shopTitle'), { fontSize:'28px', fontStyle:'bold' }).setOrigin(0.5)]);
    itemDatabase.forEach((item, i) => {
        let rowY = -120 + (i * 55);
        shopPanel.add(this.add.text(-220, rowY, item.emoji, { fontSize:'28px' }).setOrigin(0.5));
        shopPanel.add(this.add.text(-180, rowY, item.name[currentLang], { fontSize:'16px' }).setOrigin(0, 0.5));
        let priceTxt = item.price === 0 ? 'FREE' : `${item.price}${item.currency==='ACORN'?'🌰':'💎'}`;
        shopPanel.add(this.add.text(120, rowY, priceTxt, { fontSize:'16px', fill:'#f1c40f' }).setOrigin(0.5));
    });

    // Interactive shop buttons at scene level; positions computed from current scale
    let buildShopBtns = () => {
        let W = selfRef.scale.width, H = selfRef.scale.height;
        shopPanel.setPosition(W/2, H/2);
        // close button
        let shopClose = selfRef.add.text(W/2 + 260, H/2 - 200, '✖', { fontSize:'28px', fill:'#fff' }).setInteractive().setDepth(3001).setScrollFactor(0).setVisible(false);
        shopClose.on('pointerdown', () => { shopPanel.setVisible(false); shopPanelBtns.forEach(b => b.setVisible(false)); });
        shopPanelBtns.push(shopClose);
        // buy buttons
        itemDatabase.forEach((item, i) => {
            let btnY = H/2 + (-120 + i * 55);
            let buyBtn = selfRef.add.text(W/2 + 220, btnY, `[ ${t('buy')} ]`, { fontSize:'16px', fill:'#55efc4' }).setInteractive().setDepth(3001).setScrollFactor(0).setVisible(false);
            buyBtn.on('pointerdown', () => {
                activeShopItem = item;
                shopPanel.setVisible(false);
                shopPanelBtns.forEach(b => b.setVisible(false));
                hShow('hud-cancel', true);
                updateUI();
            });
            shopPanelBtns.push(buyBtn);
        });
    };
    buildShopBtns();

    function startUpgrade(targetPool, nextLevel) {
        let buildDuration = getBuildTime(nextLevel); let endTime = Date.now() + (buildDuration*1000);
        targetPool.level = nextLevel; targetPool.state = 'building'; targetPool.buildEndTime = endTime; targetPool.totalBuildTime = buildDuration; targetPool.maxOccupants = getCapacity(nextLevel);
        if(targetPool.emitter) targetPool.emitter.stop(); if(targetPool.lvlText) targetPool.lvlText.setVisible(false);
        drawPool(targetPool.graphics, targetPool.screenX, targetPool.screenY, nextLevel, 'building'); 
        targetPool.barBg.setVisible(true); targetPool.barFill.setVisible(true);
        if (!targetPool.timeText) targetPool.timeText = selfRef.add.text(targetPool.screenX, targetPool.screenY + 25, '', { fontSize: '13px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(targetPool.depthLevel + 0.2);
        targetPool.timeText.setVisible(true);
        mapData[targetPool.gridY][targetPool.gridX].status = nextLevel;
        showFloatingText(targetPool.screenX, targetPool.screenY - 40, '施工開始🚧', '#f39c12');
    }

    function executeDemolish(targetPool) {
        let refund = Math.floor(getCost(targetPool.level) * 0.4); score += refund; updateUI();
        targetPool.graphics.destroy(); targetPool.barBg.destroy(); targetPool.barFill.destroy(); 
        if(targetPool.emitter) targetPool.emitter.destroy(); 
        if(targetPool.readyIcon) {
            selfRef.tweens.killTweensOf(targetPool.readyIcon); 
            targetPool.readyIcon.destroy();
            targetPool.readyIcon = null;
        }
        if(targetPool.lvlText) targetPool.lvlText.destroy();
        if(targetPool.timeText) targetPool.timeText.destroy(); 
        mapData[targetPool.gridY][targetPool.gridX].status = 0; let pIndex = pools.indexOf(targetPool); if(pIndex > -1) pools.splice(pIndex, 1);
        showFloatingText(targetPool.screenX, targetPool.screenY - 40, `💥 退款 (+${refund})`, '#fbc531');
    }

    let initialNpcs = [ { e: '👮', t: 'patrol' }, { e: '🧹', t: 'sweep' }, { e: '🧹', t: 'sweep' } ];
    initialNpcs.forEach((n, idx) => {
        let gx = centerGrid + idx, gy = centerGrid - 1;
        let sx = offsetX + (gx - gy) * halfWidth, sy = offsetY + (gx + gy) * halfHeight;
        let obj = selfRef.add.text(sx, sy - 20, n.e, { fontSize: '24px' }).setOrigin(0.5).setDepth(gx+gy+0.1);
        townNpcs.push({ obj: obj, gx: gx, gy: gy, type: n.t });
    });

    this.time.addEvent({ delay: 3000, loop: true, callback: () => {
        if(!isGameLoaded) return;
        townNpcs.forEach(n => {
            let moves = [ {x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0} ];
            Phaser.Utils.Array.Shuffle(moves);
            for (let m of moves) {
                let nx = n.gx + m.x, ny = n.gy + m.y;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                    let tile = mapData[ny][nx];
                    if (tile.unlocked && tile.status === 0) {
                        let hasPool = pools.some(p => p.gridX === nx && p.gridY === ny);
                        let hasWall = decors.some(d => d.gx === nx && d.gy === ny && d.isWall); 
                        if (!hasPool && !hasWall) {
                            n.gx = nx; n.gy = ny;
                            let nsx = offsetX + (nx - ny) * halfWidth; let nsy = offsetY + (nx + ny) * halfHeight;
                            selfRef.tweens.add({ targets: n.obj, x: nsx, y: nsy - 20, duration: 1000, onUpdate: () => n.obj.setDepth(n.gx+n.gy+0.1) });
                            if (userSettings.vfx && Math.random() < 0.3) { showFloatingText(nsx, nsy-40, n.type==='sweep'?'✨':'👀', '#fff', '14px', false); }
                            break;
                        }
                    }
                }
            }
        });
    }});

    spawnTimerEvent = this.time.addEvent({ delay: 1500, callback: () => {
        if(!isGameLoaded) return;
        let availablePools = pools.filter(p => p.state === 'active' && (p.occupants + p.reserved) < p.maxOccupants);
        if (availablePools.length === 0) return; 
        let targetPool = Phaser.Utils.Array.GetRandom(availablePools);
        let pathIn = findPath(centerGrid, centerGrid, targetPool.gridX, targetPool.gridY, mapData, gridSize, decors);
        if (pathIn.length === 0) return;
        
        let dbEntry = Phaser.Utils.Array.GetRandom(yokaiDatabase);
        if (!dbEntry.unlocked) {
            dbEntry.unlocked = true;
            let unlockUI = selfRef.add.text(480, 100, t('msgUnlock') + dbEntry.emoji, { fontSize: '24px', fill: '#fbc531', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10 }).setOrigin(0.5).setDepth(2000).setScrollFactor(0);
            selfRef.tweens.add({ targets: unlockUI, y: 50, alpha: 0, duration: 3000, delay: 1000, onComplete: () => unlockUI.destroy() });
        }

        targetPool.reserved++; 
        let startSx = offsetX + (centerGrid - centerGrid) * halfWidth; let startSy = offsetY + (centerGrid + centerGrid) * halfHeight;
        
        let yokai = selfRef.add.sprite(startSx, startSy - 5, dbEntry.key).setOrigin(0.5, 1).setDepth(centerGrid*2+0.1); 
        if (dbEntry.id === 3) yokai.setAlpha(0.7);

        let walkTweens = [];
        for(let i = 1; i < pathIn.length; i++) {
            let stepX = pathIn[i].x, stepY = pathIn[i].y;
            walkTweens.push({ targets: yokai, x: offsetX+(stepX-stepY)*halfWidth, y: offsetY+(stepX+stepY)*halfHeight-5, duration: 350, ease: 'Linear', onStart: () => yokai.setDepth(stepX+stepY+0.1) });
        }
        // Guard: if pool is at spawn point path has only 1 step → walkTweens is empty → tweens.chain crashes on undefined[0]
        if (walkTweens.length === 0) { walkTweens.push({ targets: yokai, duration: 50 }); }

        selfRef.tweens.chain({
            tweens: walkTweens,
            onComplete: function() {
                targetPool.reserved--; targetPool.occupants++;
                
                let affectionBubble = null;
                if(Math.random() < 0.20) { 
                    let isMilk = Math.random() > 0.5;
                    affectionBubble = selfRef.add.text(targetPool.screenX, targetPool.screenY - 50, isMilk ? '🍼' : '🍡', {fontSize:'24px', backgroundColor:'#fff', padding:{x:5,y:5}}).setOrigin(0.5).setInteractive().setDepth(2000);
                    
                    affectionBubble.on('pointerdown', () => {
                        affectionBubble.setVisible(false);
                        
                        dbEntry.affection++; score += 50; updateUI(); 
                        showFloatingText(targetPool.screenX, targetPool.screenY - 60, '❤️', '#ff7675'); 
                        
                        if (dbEntry.affection >= 3 && !ownedYokais.find(y => y.id === dbEntry.id)) {
                            ownedYokais.push({ ...dbEntry, level: 1, state: 'idle' });
                            selfRef.cameras.main.flash(300, 255, 255, 100, 0.4);
                            showFloatingText(480, 150, `🎉 ${dbEntry.name[currentLang]}！`, '#f1c40f', '28px', true);
                        }
                        selfRef.time.delayedCall(50, () => { if(affectionBubble) { affectionBubble.destroy(); affectionBubble = null; } });
                    });
                    selfRef.time.delayedCall(5000, () => { if(affectionBubble && affectionBubble.active) { affectionBubble.destroy(); affectionBubble = null; } });
                }

                selfRef.tweens.add({
                    targets: yokai, 
                    x: targetPool.screenX + (Math.random()-0.5)*15, 
                    y: targetPool.screenY - 5 + (Math.random()-0.5)*10, 
                    scaleY: 0.85, 
                    duration: 800, yoyo: true, repeat: 4, ease: 'Sine.easeInOut',
                    onComplete: function() {
                        if (affectionBubble && affectionBubble.active) { affectionBubble.destroy(); affectionBubble = null; }
                        targetPool.occupants--; 
                        if (targetPool.state === 'waiting_upgrade' && targetPool.occupants === 0 && targetPool.reserved === 0) { startUpgrade(targetPool, targetPool.nextLevel); }
                        else if (targetPool.state === 'waiting_demolish' && targetPool.occupants === 0 && targetPool.reserved === 0) { executeDemolish(targetPool); }
                        
                        let envBonus = 0; let searchRadius = 2; 
                        decors.forEach(d => {
                            let dist = Math.max(Math.abs(d.gx - targetPool.gridX), Math.abs(d.gy - targetPool.gridY));
                            if (dist <= searchRadius) {
                                let itemDef = itemDatabase.find(i => i.id === d.itemId);
                                if (itemDef) { if (itemDef.type === 'ART') envBonus += 0.05; else if (itemDef.type === 'SPECIAL') envBonus += 0.15; }
                            }
                        });
                        
                        envBonus = Math.min(envBonus, 0.50);
                        // SSR trait bonus: owned SSR yokai passively boost pool yield
                        let ssrBonus = 0;
                        ownedYokais.forEach(y => {
                            if (y.id===0) ssrBonus += 0.15;  // 九尾狐 gem bonus — translated to acorn here
                            if (y.id===4) ssrBonus += 0.20;  // 櫻花精
                            if (y.id===6) ssrBonus += 0.25;  // 雷獅
                        });
                        ssrBonus = Math.min(ssrBonus, 0.60);
                        let totalBonus = Math.min(envBonus + ssrBonus, 0.90);
                        let baseYield = getYield(targetPool.level); let finalYield = Math.floor(baseYield * (1 + totalBonus));

                        score += finalYield; selfRef.addExp(Math.floor(finalYield * 0.1));

                        let popupText = '+' + finalYield; let popupColor = '#ffeaa7'; let popupSize = '18px';
                        if (totalBonus > 0) { popupText += ` (+${Math.floor(totalBonus * 100)}%)`; popupColor = ssrBonus > 0 ? '#f1c40f' : '#55efc4'; popupSize = '20px'; }
                        
                        showFloatingText(targetPool.screenX, targetPool.screenY - 40, popupText, popupColor, popupSize);

                        questStats.yokaiServed++; selfRef.checkQuests(); 
                        selfRef.tweens.add({ targets: yokai, x: startSx, y: startSy-100, alpha: 0, duration: 2000, onComplete: () => yokai.destroy() });
                    }
                });
            }
        });
    }, loop: true });

    // These Phaser buttons are kept invisible — their handlers are called via window.GameAPI
    let btnShopUI = this.add.text(-9999, -9999, t('btnShop'), { fontSize:'18px' }).setInteractive().setDepth(1000).setScrollFactor(0).setVisible(false);
    btnShopUI.on('pointerdown', () => { if(isGameLoaded) { shopPanel.setVisible(true); shopPanelBtns.forEach(b=>b.setVisible(true)); } });

    let btnRosterUI = this.add.text(-9999, -9999, '🎒', { fontSize:'18px' }).setInteractive().setDepth(1000).setScrollFactor(0).setVisible(false);
    btnRosterUI.on('pointerdown', () => { if(isGameLoaded) openRoster(); });

    let btnFriend = this.add.text(-9999, -9999, '🤝', { fontSize:'18px' }).setInteractive().setDepth(1000).setScrollFactor(0).setVisible(false);
    let friendCooldown = 0;
    btnFriend.on('pointerdown', () => {
        if(!isGameLoaded) return;
        if(friendCooldown<=0) {
            let assistExp = Math.max(1, playerLevel + Math.floor(Math.random()*3) - 1) * 30;
            selfRef.addExp(assistExp); selfRef.cameras.main.fadeOut(200,0,0,0);
            selfRef.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                showFloatingText(selfRef.scale.width/2, selfRef.scale.height/2, `🤝\n+${assistExp} EXP`, '#55efc4', '24px', true); selfRef.cameras.main.fadeIn(300,0,0,0);
            });
            friendCooldown = 45; btnFriend.setText(`${friendCooldown}s`);
        }
    });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { if(friendCooldown>0){ friendCooldown--; if(friendCooldown<=0) btnFriend.setText('🤝'); else btnFriend.setText(`${friendCooldown}s`); } }});

    // ── 每日登入系統 ───────────────────────────────────────────────
    function checkDailyLogin() {
        let today = new Date().toDateString();
        if (lastLoginDate === today) return; // 今天已登入
        let yesterday = new Date(Date.now() - 86400000).toDateString();
        loginStreak = (lastLoginDate === yesterday) ? loginStreak + 1 : 1;
        lastLoginDate = today;
        selfRef.time.delayedCall(800, () => showLoginPanel());
    }

    function showLoginPanel() {
        let el = document.getElementById('login-modal');
        if (!el) return;
        let day = ((loginStreak - 1) % 7); // 0-based index into loginRewardTable
        let reward = loginRewardTable[day];
        // 建立7天格
        let grid = document.getElementById('login-day-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            let r = loginRewardTable[i];
            let box = document.createElement('div');
            let isCurrent = i === day;
            let isPast = i < day;
            box.className = 'login-day-box' + (isCurrent ? ' today' : '') + (isPast ? ' claimed' : '');
            box.innerHTML = `<div class="login-day-num">Day ${i+1}</div><div class="login-day-icon">${r.icon}</div><div class="login-day-lbl">${r.label[currentLang] || r.label['en']}</div>`;
            grid.appendChild(box);
        }
        document.getElementById('login-streak-num').textContent = loginStreak;
        document.getElementById('login-today-reward').textContent = reward.label[currentLang] || reward.label['en'];
        document.getElementById('login-claim-btn').textContent = t('loginClaim');
        document.getElementById('login-modal-title').textContent = t('loginTitle');
        el.style.display = 'flex';
    }

    // ── 召喚(抽卡)系統 ─────────────────────────────────────────────
    function doGachaDraw(results) {
        // unlocked already set on DB objects during draw loop; sync dex display
        updateUI();
        // 顯示結果卡片
        let area = document.getElementById('gacha-result-area');
        area.innerHTML = '';
        results.forEach((yokai, idx) => {
            let card = document.createElement('div');
            let rarityClass = yokai.rarity.toLowerCase();
            card.className = `gacha-card ${rarityClass}`;
            card.style.animationDelay = `${idx * 0.1}s`;
            let isNew = (results.filter(r => r.id === yokai.id).indexOf(yokai) === 0 && !yokai._wasUnlocked);
            card.innerHTML = `<div class="card-emoji">${yokai.emoji}</div><div class="card-name">${yokai.name[currentLang]||yokai.name.en}</div><div class="card-rarity ${rarityClass}">${yokai.rarity} ${'★'.repeat(yokai.rarity==='SSR'?3:yokai.rarity==='SR'?2:1)}</div>${isNew?`<div class="card-new">${t('gachaNew')}</div>`:''}`;
            area.appendChild(card);
        });
        // 更新保底計數
        document.getElementById('gacha-pity-num').textContent = gachaPity;
        // 有SSR就閃光
        if (results.some(y => y.rarity === 'SSR')) {
            selfRef.cameras.main.flash(600, 255, 220, 50, 0.6);
            showFloatingText(selfRef.scale.width/2, selfRef.scale.height/3, '✨ S級！', '#f1c40f', '32px', true);
        }
    }

    // --- [HTML UI 橋接 — 讓固定 HTML 按鈕呼叫 Phaser 內部函式] ---
    window.GameAPI = {
        toggleBuild:  () => uiMode.emit('pointerdown'),
        openSettings: () => btnSettings.emit('pointerdown'),
        openDex:      () => btnDex.emit('pointerdown'),
        openShop:     () => btnShopUI.emit('pointerdown'),
        openRoster:   () => btnRosterUI.emit('pointerdown'),
        openFriend:   () => btnFriend.emit('pointerdown'),
        toggleTime:   () => btnTimeToggle.emit('pointerdown'),
        topup:        () => { if (!isGameLoaded) return; premiumCoin += 50; updateUI(); showFloatingText(selfRef.scale.width/2, 80, '+50 💎', '#81ecec', '18px', true); },
        cancelBuild:  () => { if (!isGameLoaded) return; activeShopItem = null; hShow('hud-cancel', false); updateUI(); },
        openExped:    () => doExpedAction(),

        // 每日登入
        claimLogin: () => {
            if (!isGameLoaded) return;
            let day = ((loginStreak - 1) % 7);
            let reward = loginRewardTable[day];
            score += reward.acorn; premiumCoin += reward.gem; updateUI();
            if (reward.acorn > 0) showFloatingText(selfRef.scale.width/2, selfRef.scale.height/2, `+${reward.acorn} 🌰`, '#fbc531', '24px', true);
            if (reward.gem > 0)   showFloatingText(selfRef.scale.width/2, selfRef.scale.height/2-40, `+${reward.gem} 💎`, '#81ecec', '24px', true);
            document.getElementById('login-modal').style.display = 'none';
        },

        // 召喚面板
        openGacha: () => {
            if (!isGameLoaded) return;
            let today = new Date().toDateString();
            let freeAvail = lastFreeDrawDate !== today;
            let btn = document.getElementById('gacha-btn-free');
            if (btn) { btn.disabled = !freeAvail; btn.textContent = freeAvail ? t('gachaFree') : `✅ ${t('loginDone')}`; }
            document.getElementById('gacha-pity-num').textContent = gachaPity;
            document.getElementById('gacha-result-area').innerHTML = '';
            document.getElementById('gacha-modal-title').textContent = t('gachaTitle');
            document.getElementById('gacha-rates-text').textContent = t('gachaRates');
            document.getElementById('gacha-btn-single').textContent = t('gachaSingle');
            document.getElementById('gacha-btn-ten').textContent = t('gachaTen');
            document.getElementById('gacha-btn-close').textContent = t('gachaClose');
            document.getElementById('gacha-pity-label').textContent = t('gachaPityLabel');
            document.getElementById('gacha-modal').style.display = 'flex';
        },
        closeGacha: () => { document.getElementById('gacha-modal').style.display = 'none'; },

        // 抽卡邏輯
        gachaDraw: (count, isFree = false) => {
            if (!isGameLoaded) return;
            let today = new Date().toDateString();
            if (isFree) {
                if (lastFreeDrawDate === today) { showFloatingText(selfRef.scale.width/2, 80, t('loginDone'), '#ff7675', '18px', true); return; }
                lastFreeDrawDate = today;
                let btn = document.getElementById('gacha-btn-free');
                if (btn) { btn.disabled = true; btn.textContent = `✅ ${t('loginDone')}`; }
            } else {
                let cost = count === 10 ? 90 : 10;
                if (premiumCoin < cost) { showFloatingText(selfRef.scale.width/2, 80, t('gachaNoGems'), '#ff7675', '18px', true); return; }
                premiumCoin -= cost; updateUI();
            }
            // 執行抽卡
            let results = [];
            for (let i = 0; i < count; i++) {
                gachaPity++;
                let rarity;
                if (gachaPity >= 10) { rarity = 'SSR'; gachaPity = 0; }
                else { let roll = Math.random() * 100; rarity = roll < 3 ? 'SSR' : roll < 23 ? 'SR' : 'R'; if (rarity === 'SSR') gachaPity = 0; }
                let pool = (typeof gachaPool !== 'undefined' && gachaPool[rarity]) ? gachaPool[rarity] : [0];
                let targetId = pool[Math.floor(Math.random() * pool.length)];
                let yokai = yokaiDatabase.find(y => y.id === targetId);
                if (!yokai) yokai = yokaiDatabase[Math.floor(Math.random() * yokaiDatabase.length)]; // fallback
                let wasUnlocked = yokai.unlocked;
                yokai.unlocked = true;
                results.push({ ...yokai, _wasUnlocked: wasUnlocked }); // shallow copy avoids mutating DB ref
            }
            doGachaDraw(results);
        },
    };

    // --- [視窗縮放自動重新定位 UI] ---
    function repositionUI(W, H) {
        // Recentre the oversized overlay and ocean bg to screen centre
        nightOverlay.setPosition(W / 2, H / 2);
        oceanBg.setPosition(W / 2, H / 2);
    }
    repositionUI(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize) => {
        repositionUI(gameSize.width, gameSize.height);
    });
}

function update() {
    if (!isGameLoaded) return; 

    let now = Date.now();
    for (let i = 0; i < pools.length; i++) {
        let p = pools[i];
        if (p.state === 'building') {
            let timeLeft = (p.buildEndTime - now) / 1000;
            if (timeLeft <= 0) {
                p.state = 'ready'; p.timeLeft = 0; p.barBg.setVisible(false); p.barFill.setVisible(false);
                if(p.timeText) p.timeText.setVisible(false);
                if(!p.readyIcon || !p.readyIcon.active) {
                    p.readyIcon = selfRef.add.text(p.screenX, p.screenY - 30, '👆', { fontSize: '32px' }).setOrigin(0.5).setDepth(1001);
                    selfRef.tweens.add({ targets: p.readyIcon, y: p.screenY - 45, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });
                }
            } else { p.timeLeft = timeLeft; p.barFill.width = 40 * (1 - (timeLeft / p.totalBuildTime)); if(p.timeText) p.timeText.setText(Math.ceil(timeLeft) + 's').setVisible(true); }
        }
    }
    
    if (activeExpedition && activeExpedition.state === 'exploring') {
        activeExpedition.timeLeft -= 1/60; 
        if (activeExpedition.timeLeft <= 0) {
            activeExpedition.state = 'done'; activeExpedition.marker.setText('🎁'); 
            hText('hbtn-exped', '🎁 領獎！');
        } else { hText('hbtn-exped', `🎒 ${Math.ceil(activeExpedition.timeLeft)}s`); }
    }

    while(activeTiles.length > 0) { let t = activeTiles.pop(); t.setVisible(false); tilePool.push(t); }
    while(activeFogs.length > 0) { let f = activeFogs.pop(); f.setVisible(false); fogPool.push(f); }
    while(activeSigns.length > 0) { let s = activeSigns.pop(); s.setVisible(false); signPool.push(s); }
    while(activeVillages.length > 0) { let v = activeVillages.pop(); v.setVisible(false); villagePool.push(v); }

    let cam = selfRef.cameras.main;
    let vX = cam.scrollX; let vY = cam.scrollY;
    let vW = cam.width / cam.zoom; let vH = cam.height / cam.zoom;

    function screenToGrid(x, y) {
        let isoX = (x - offsetX) / halfWidth; let isoY = (y - offsetY) / halfHeight;
        return { gx: Math.floor((isoY + isoX) / 2), gy: Math.floor((isoY - isoX) / 2) };
    }
    let tl = screenToGrid(vX, vY); let tr = screenToGrid(vX + vW, vY);
    let bl = screenToGrid(vX, vY + vH); let br = screenToGrid(vX + vW, vY + vH);

    let minGx = Math.max(0, Math.min(tl.gx, tr.gx, bl.gx, br.gx) - 2);
    let maxGx = Math.min(gridSize - 1, Math.max(tl.gx, tr.gx, bl.gx, br.gx) + 2);
    let minGy = Math.max(0, Math.min(tl.gy, tr.gy, bl.gy, br.gy) - 2);
    let maxGy = Math.min(gridSize - 1, Math.max(tl.gy, tr.gy, bl.gy, br.gy) + 2);

    for (let y = minGy; y <= maxGy; y++) {
        for (let x = minGx; x <= maxGx; x++) {
            let tile = mapData[y][x];
            if(!tile) continue;
            // Far ocean tiles are covered by the background rect — skip to save pool sprites
            if (tile.status === -7) continue;
            let sx = offsetX + (x - y) * halfWidth; let sy = offsetY + (x + y) * halfHeight;

            if(tilePool.length > 0) {
                let spr = tilePool.pop();
                spr.setPosition(sx, sy).setDepth(x+y).setVisible(true);
                activeTiles.push(spr);

                if (tile.status === -8) { spr.setTexture('ocean').setOrigin(0.5, 0); }
                else if (tile.status === -6) spr.setTexture('cliff').setOrigin(0.5, 0);
                else if (tile.status === -2) spr.setTexture('mountain').setOrigin(0.5, 0.9);
                else if (tile.status === -3) spr.setTexture('river').setOrigin(0.5, 0);
                else if (tile.status === -4) spr.setTexture('waterfall').setOrigin(0.5, 0);
                else spr.setTexture((x+y)%2===0 ? 'grass1' : 'grass2').setOrigin(0.5, 0);
            }

            // No fog or expand signs on ocean border tiles
            if (tile.status === -8) continue;

            // Village tiles are always visible (no fog) so players can see expedition targets
            if (tile.status === -5) {
                if (villagePool.length > 0) {
                    let v = villagePool.pop(); v.setPosition(sx, sy-20).setDepth(x+y+0.9).setVisible(true); activeVillages.push(v);
                }
                continue;
            }

            if (!tile.unlocked && fogPool.length > 0) {
                let fog = fogPool.pop(); fog.setPosition(sx, sy).setDepth(x+y+0.5).setVisible(true); activeFogs.push(fog);
            }

            if (!tile.unlocked && tile.isAdj && tile.status !== -6 && signPool.length > 0) {
                let sign = signPool.pop(); sign.setPosition(sx, sy-10).setDepth(x+y+0.6).setVisible(true); activeSigns.push(sign);
            }
        }
    }
}
