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
let activeShopItem = null, timeMode = 'auto', activeExpedition = null; 
let ownedYokais = []; 

let isGameLoaded = false; 

let gridSize = 250; 
const centerGrid = Math.floor(gridSize / 2); 
const halfWidth = 32, halfHeight = 16, tileThickness = 8; 
const offsetX = gridSize * halfWidth, offsetY = 0; 
const SAVE_KEY = 'yokai_hotspring_save_v1_4';

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
    width: 960,
    height: 540,
    backgroundColor: '#2d3436', 
    scale: {
        mode: Phaser.Scale.FIT,              
        autoCenter: Phaser.Scale.CENTER_BOTH 
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
    g.fillStyle(0x000000, 0.75); g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath(); g.generateTexture('fog', 64, 32); g.clear();
    draw3DTile('cliff', 0x2d3436, 0x1e272e, 0x000000);

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
    let isBuildMode = true;

    if (window.location.protocol !== 'file:') {
        soundWaterfall = this.sound.add('bgm_waterfall', { loop: true, volume: 0.1 });
        soundDay = this.sound.add('bgm_day', { loop: true, volume: 0.15 });
        soundNight = this.sound.add('bgm_night', { loop: true, volume: 0 }); 
    }

    // --- [載入畫面由 HTML overlay 處理，支援全螢幕自適應] ---
    let loadScreen = document.getElementById('loading-screen');
    let loadEnterBtn = document.getElementById('loading-enter');
    // ------------------------------------

    function generateNewMap() {
        for (let y = 0; y < gridSize; y++) {
            let row = [];
            for (let x = 0; x < gridSize; x++) {
                let status = 0; 
                if (x === 0 || x === gridSize-1 || y === 0 || y === gridSize-1) status = -6; 
                else { let r = Math.random(); if (r < 0.12) status = -2; else if (r < 0.18) status = -3; else if (r < 0.19) status = -5; }
                let unlocked = false;
                if (Math.abs(x - centerGrid) <= 3 && Math.abs(y - centerGrid) <= 3) { status = 0; unlocked = true; } 
                if (status === -5 && Math.abs(x - centerGrid) <= 10 && Math.abs(y - centerGrid) <= 10) status = 0; 
                row.push({ status: status, unlocked: unlocked, isAdj: false });
            }
            mapData.push(row);
        }
        for (let y = 1; y < gridSize-1; y++) {
            for (let x = 1; x < gridSize-1; x++) { if (mapData[y][x].status === -3 && mapData[y-1][x].status === -2) mapData[y][x].status = -4; }
        }
        updateAdjacency();
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
                yokaiDatabase.forEach((y, i) => { if (data.dex[i]) { y.unlocked = data.dex[i].unlocked; y.affection = data.dex[i].affection; } });
                mapData = data.mapData.map(row => row.map(t => ({ status: t[0], unlocked: t[1] === 1, isAdj: t[2] === 1 })));

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

    // 幕後生成地圖與讀檔
    this.time.delayedCall(100, () => {
        if (!loadGameData()) { generateNewMap(); generateQuest(); }
    });

    // 1.8秒後顯示進入遊戲按鈕
    this.time.delayedCall(1800, () => {
        updateUI();
        if (activeExpedition) uiExpedTracker.setVisible(true);

        if (loadEnterBtn) loadEnterBtn.style.display = 'block';

        let enterHandler = () => {
            isGameLoaded = true;
            if (userSettings.music) {
                if (soundWaterfall && !soundWaterfall.isPlaying) soundWaterfall.play();
                if (soundDay && !soundDay.isPlaying) soundDay.play();
                if (soundNight && !soundNight.isPlaying) soundNight.play();
                syncRealTime();
            }
            if (loadScreen) {
                loadScreen.style.opacity = '0';
                setTimeout(() => { if (loadScreen.parentNode) loadScreen.parentNode.removeChild(loadScreen); }, 1000);
            }
        };
        if (loadEnterBtn) loadEnterBtn.addEventListener('click', enterHandler, { once: true });
    });

    function updateAdjacency() {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                mapData[y][x].isAdj = false;
                if (!mapData[y][x].unlocked) {
                    let n = [{x:x,y:y-1},{x:x,y:y+1},{x:x-1,y:y},{x:x+1,y:y}];
                    for (let i of n) { if(i.x>=0 && i.x<gridSize && i.y>=0 && i.y<gridSize && mapData[i.y][i.x].unlocked) { mapData[y][x].isAdj = true; break; } }
                }
            }
        }
    }

    for(let i=0; i<1500; i++) tilePool.push(this.add.sprite(0,0,'grass1').setVisible(false).setOrigin(0.5, 0)); 
    for(let i=0; i<1500; i++) fogPool.push(this.add.sprite(0,0,'fog').setVisible(false).setOrigin(0.5, 0.5));
    for(let i=0; i<150; i++) signPool.push(this.add.text(0,0,'💰', {fontSize:'16px'}).setVisible(false).setOrigin(0.5));
    for(let i=0; i<50; i++) villagePool.push(this.add.text(0,0,'🏯', {fontSize:'32px'}).setVisible(false).setOrigin(0.5));

    nightOverlay = this.add.rectangle(480, 270, 960, 540, 0x0a3d62, 0).setDepth(1800).setScrollFactor(0);

    // [模組化] 初始化天氣系統
    if (typeof WeatherSystem !== 'undefined') {
        WeatherSystem.init(selfRef);
    }

    uiScore = this.add.text(20, 15, '', { fontSize: '20px', fill: '#ffeaa7', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setDepth(2000).setScrollFactor(0);
    uiPremium = this.add.text(20, 40, '', { fontSize: '20px', fill: '#81ecec', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setDepth(2000).setScrollFactor(0);
    uiPlayerLvl = this.add.text(300, 15, '', { fontSize: '18px', fill: '#55efc4', fontStyle: 'bold', backgroundColor: 'rgba(45,52,54,0.8)', padding: {x:8,y:4} }).setDepth(2000).setScrollFactor(0);
    uiTime = this.add.text(720, 15, '🕐', { fontSize: '16px', fill: '#fff' }).setDepth(2000).setScrollFactor(0);
    btnTimeToggle = this.add.text(720, 45, '', { fontSize: '14px', fill: '#fff', backgroundColor: '#34495e', padding: {x:10, y:5} }).setInteractive().setDepth(2000).setScrollFactor(0);
    btnTimeToggle.on('pointerdown', () => { if(!isGameLoaded) return; if (timeMode === 'auto') timeMode = 'day'; else if (timeMode === 'day') timeMode = 'night'; else timeMode = 'auto'; syncRealTime(); });

    let btnTopup = this.add.text(180, 42, '➕', { fontSize: '14px', backgroundColor: '#e84393', padding: { x: 5, y: 3 } }).setInteractive().setDepth(2000).setScrollFactor(0);
    btnTopup.on('pointerdown', () => { if(!isGameLoaded) return; premiumCoin += 50; updateUI(); showFloatingText(220, 40, '+50 💎', '#81ecec', '18px', true); });

    uiMode = this.add.text(20, 80, '', { fontSize: '16px', backgroundColor: '#27ae60', padding: { x: 10, y: 8 } }).setInteractive().setDepth(2000).setScrollFactor(0);
    uiMode.on('pointerdown', () => { if(!isGameLoaded) return; isBuildMode = !isBuildMode; activeShopItem = null; uiBuildCancel.setVisible(false); if (isBuildMode) uiMode.setBackgroundColor('#27ae60'); else uiMode.setBackgroundColor('#c0392b'); updateUI(); });
    
    btnSettings = this.add.text(20, 120, '⚙️ Settings', { fontSize: '14px', backgroundColor: '#34495e', padding: { x: 5, y: 5 } }).setInteractive().setDepth(2000).setScrollFactor(0);
    btnSettings.on('pointerdown', () => { if(isGameLoaded) openSettings(); });

    let btnDex = this.add.text(20, 155, '', { fontSize: '16px', backgroundColor: '#8e44ad', padding: { x: 8, y: 8 } }).setInteractive().setDepth(2000).setScrollFactor(0);
    btnDex.on('pointerdown', () => { if(isGameLoaded) openPokedex(); });

    uiQuest = this.add.text(20, 195, '📜 ...', { fontSize: '14px', fill: '#b2bec3', backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 5, y: 5 } }).setDepth(2000).setScrollFactor(0);
    uiExpedTracker = this.add.text(20, 240, '', { fontSize: '16px', fill: '#a29bfe', backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 8, y: 8 } }).setInteractive().setDepth(2000).setScrollFactor(0).setVisible(false);
    uiExpedTracker.on('pointerdown', () => {
        if(!isGameLoaded) return;
        if(activeExpedition && activeExpedition.state === 'done') {
            score += activeExpedition.rewardAcorn; premiumCoin += activeExpedition.rewardGem;
            showFloatingText(480, 270, `🎉\n+${activeExpedition.rewardAcorn}🌰\n+${activeExpedition.rewardGem}💎`, '#fbc531', '28px', true);
            selfRef.tweens.killTweensOf(activeExpedition.marker); 
            activeExpedition.marker.destroy();
            activeExpedition.team.forEach(id => { let y = ownedYokais.find(oy => oy.id === id); if (y) y.state = 'idle'; });
            activeExpedition = null; uiExpedTracker.setVisible(false); updateUI();
        } else if (activeExpedition) {
            let vSx = offsetX + (activeExpedition.gx - activeExpedition.gy) * halfWidth; let vSy = offsetY + (activeExpedition.gx + activeExpedition.gy) * halfHeight;
            selfRef.cameras.main.pan(vSx, vSy, 800, 'Sine.easeInOut');
        }
    });

    uiBuildCancel = this.add.text(480, 70, '🚫 Cancel', { fontSize: '18px', fill: '#fff', backgroundColor: '#c0392b', padding: {x:15, y:10} }).setOrigin(0.5).setInteractive().setDepth(3000).setScrollFactor(0).setVisible(false);
    uiBuildCancel.on('pointerdown', () => { if(!isGameLoaded) return; activeShopItem = null; uiBuildCancel.setVisible(false); updateUI(); });
    
    uiSaveSync = this.add.text(950, 530, '💾 Saving...', { fontSize: '12px', fill: '#bdc3c7', backgroundColor: 'rgba(0,0,0,0.5)', padding: {x:5, y:3} }).setOrigin(1, 1).setDepth(4000).setScrollFactor(0).setVisible(false);

    function openSettings() {
        if (settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; return; }
        if (dexPanel) { dexPanel.destroy(true); dexPanel = null; }
        if (rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; }
        if (shopPanel && shopPanel.visible) { shopPanel.setVisible(false); }

        settingsPanel = selfRef.add.container(480, 270).setDepth(4000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(0, 0, 420, 380, 0x2c3e50, 0.95).setStrokeStyle(4, 0xbdc3c7).setInteractive();
        let title = selfRef.add.text(0, -150, '⚙️ Settings', { fontSize: '24px', fill: '#fbc531', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = selfRef.add.text(170, -150, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', (p) => { 
            p.stopPropagation(); 
            selfRef.time.delayedCall(10, () => { if(settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; } });
        });
        
        settingsPanel.add([bg, title, closeBtn]);

        let langLabel = selfRef.add.text(-170, -70, '🌐 Language:', { fontSize: '18px', fill: '#fff' });
        let langBtn = selfRef.add.text(80, -70, currentLang.toUpperCase(), { fontSize: '18px', fill: '#f1c40f', backgroundColor: '#34495e', padding:{x:15,y:8} }).setOrigin(0, 0).setInteractive();
        langBtn.on('pointerdown', () => {
            let idx = availableLangs.indexOf(currentLang);
            currentLang = availableLangs[(idx + 1) % availableLangs.length];
            userSettings.lang = currentLang;
            saveSettings();
            langBtn.setText(currentLang.toUpperCase());
            updateUI(); 
            syncRealTime();
        });
        settingsPanel.add([langLabel, langBtn]);

        function createToggle(y, labelText, key) {
            let label = selfRef.add.text(-170, y, labelText, { fontSize: '18px', fill: '#fff' });
            let statusText = userSettings[key] ? '✅ ON' : '❌ OFF';
            let color = userSettings[key] ? '#27ae60' : '#c0392b';
            let btn = selfRef.add.text(80, y, statusText, { fontSize: '18px', fill: '#fff', backgroundColor: color, padding:{x:15,y:8} }).setInteractive();
            btn.on('pointerdown', () => {
                userSettings[key] = !userSettings[key];
                saveSettings();
                btn.setText(userSettings[key] ? '✅ ON' : '❌ OFF');
                btn.setBackgroundColor(userSettings[key] ? '#27ae60' : '#c0392b');
                applySettings(); 
            });
            settingsPanel.add([label, btn]);
        }

        createToggle(-10, '🎵 Music:', 'music');
        createToggle(50, '🔊 SFX:', 'sfx');
        createToggle(110, '✨ VFX:', 'vfx');
        
        let vfxDesc = selfRef.add.text(0, 160, '* Disable VFX for better performance.', { fontSize: '14px', fill: '#b2bec3' }).setOrigin(0.5);
        settingsPanel.add(vfxDesc);
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
        if (dexPanel) { dexPanel.destroy(true); dexPanel = null; return; } 
        if (rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; } 
        if (settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; }
        dexPanel = selfRef.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(480, 270, 960, 540, 0x000000, 0.85).setInteractive();
        let title = selfRef.add.text(480, 50, t('btnDex'), { fontSize: '32px', fill: '#fbc531', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = selfRef.add.text(920, 50, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', (p) => { 
            p.stopPropagation(); 
            selfRef.time.delayedCall(10, () => { if(dexPanel) { dexPanel.destroy(true); dexPanel = null; } });
        });
        
        dexPanel.add([bg, title, closeBtn]);
        yokaiDatabase.forEach((yokai, index) => {
            let rowY = 120 + index * 90;
            let avatar = selfRef.add.text(200, rowY, yokai.unlocked ? yokai.emoji : '❓', { fontSize: '48px' }).setOrigin(0.5);
            let nameStr = yokai.unlocked ? yokai.name[currentLang] : '???';
            let descStr = yokai.unlocked ? (yokai.affection >= 3 ? yokai.lore[currentLang] : `(❤️ 3)`) : '...';
            let nameTxt = selfRef.add.text(250, rowY - 20, `${nameStr} [❤️ ${yokai.affection}/3]`, { fontSize: '20px', fill: '#55efc4', fontStyle: 'bold' });
            let descTxt = selfRef.add.text(250, rowY + 5, descStr, { fontSize: '14px', fill: '#b2bec3', wordWrap: { width: 450 } });
            dexPanel.add([avatar, nameTxt, descTxt]);
        });
    }

    function openRoster() {
        if (rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; return; } 
        if (dexPanel) { dexPanel.destroy(true); dexPanel = null; } 
        if (settingsPanel) { settingsPanel.destroy(true); settingsPanel = null; }
        rosterPanel = selfRef.add.container(0, 0).setDepth(3000).setScrollFactor(0);
        let bg = selfRef.add.rectangle(480, 270, 960, 540, 0x1a252f, 0.95).setInteractive();
        let title = selfRef.add.text(480, 50, '🎒 Roster', { fontSize: '32px', fill: '#ff9ff3', fontStyle: 'bold' }).setOrigin(0.5);
        let closeBtn = selfRef.add.text(920, 50, '✖', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        closeBtn.on('pointerdown', (p) => { 
            p.stopPropagation(); 
            selfRef.time.delayedCall(10, () => { if(rosterPanel) { rosterPanel.destroy(true); rosterPanel = null; } });
        });
        
        rosterPanel.add([bg, title, closeBtn]);

        if (ownedYokais.length === 0) {
            let emptyMsg = selfRef.add.text(480, 270, 'Empty Roster.', { fontSize: '20px', fill: '#b2bec3', align: 'center', lineSpacing: 10 }).setOrigin(0.5);
            rosterPanel.add(emptyMsg);
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
    }

    function syncRealTime() {
        if (!btnTimeToggle) return;
        let isNightTime = false;
        if (timeMode === 'auto') {
            const now = new Date(); const hour = now.getHours(); const min = now.getMinutes().toString().padStart(2, '0');
            btnTimeToggle.setText(t('timeAuto')); btnTimeToggle.setBackgroundColor('#34495e'); uiTime.setText(`🕐 ${hour}:${min}`);
            if (hour >= 18 || hour < 6) { nightOverlay.fillAlpha = 0.7; isNightTime = true; } else if (hour === 17 || hour === 6) { nightOverlay.fillAlpha = 0.3; isNightTime = true; } else { nightOverlay.fillAlpha = 0; }
        } else if (timeMode === 'day') {
            btnTimeToggle.setText(t('timeDay')); btnTimeToggle.setBackgroundColor('#e67e22'); uiTime.setText('☀️ --:--'); nightOverlay.fillAlpha = 0; isNightTime = false;
        } else if (timeMode === 'night') {
            btnTimeToggle.setText(t('timeNight')); btnTimeToggle.setBackgroundColor('#2c3e50'); uiTime.setText('🌙 --:--'); nightOverlay.fillAlpha = 0.7; isNightTime = true;
        }
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
        uiSaveSync.setVisible(true);
        let saveData = {
            tutorialStep: tutorialStep,
            score: score, premiumCoin: premiumCoin, playerLevel: playerLevel, playerExp: playerExp, questStats: questStats, currentQuest: currentQuest, ownedYokais: ownedYokais,
            dex: yokaiDatabase.map(y => ({ unlocked: y.unlocked, affection: y.affection })),
            mapData: mapData.map(row => row.map(t => [t.status, t.unlocked ? 1 : 0, t.isAdj ? 1 : 0])),
            pools: pools.map(p => ({ x: p.gridX, y: p.gridY, lvl: p.level, state: p.state, timeLeft: p.timeLeft, total: p.totalBuildTime, occ: p.occupants, res: p.reserved, max: p.maxOccupants })),
            decors: decors.map(d => ({ id: d.itemId, x: d.gx, y: d.gy, lvl: d.level, isWall: d.isWall })),
            activeExpedition: activeExpedition ? { gx: activeExpedition.gx, gy: activeExpedition.gy, sx: activeExpedition.sx, sy: activeExpedition.sy, dist: activeExpedition.dist, timeTotal: activeExpedition.timeTotal, timeLeft: activeExpedition.timeLeft, rewardAcorn: activeExpedition.rewardAcorn, rewardGem: activeExpedition.rewardGem, state: activeExpedition.state, team: activeExpedition.team } : null
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        selfRef.time.delayedCall(1000, () => uiSaveSync.setVisible(false));
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
        if (playerExp >= req) { playerExp -= req; playerLevel++; selfRef.cameras.main.flash(300, 85, 239, 196, 0.3); showFloatingText(480, 270, '🎉 升級 Lv' + playerLevel, '#55efc4', '32px', true); }
        updateUI();
    };

    function updateUI() {
        if (!currentQuest) return; 
        uiScore.setText(`${t('acorns')}: ${score} 🌰`); uiPremium.setText(`${t('gems')}: ${premiumCoin} 💎`);
        uiPlayerLvl.setText(`${t('lvl')} ${playerLevel} (EXP: ${playerExp}/${getExpRequired(playerLevel)})`);
        btnDex.setText(t('btnDex'));
        if (activeShopItem) uiMode.setText(`🪑: ${activeShopItem.name[currentLang]}`).setBackgroundColor('#8e44ad');
        else uiMode.setText(isBuildMode ? t('modeBuild') : t('modeDemolish'));
        if (currentQuest.type === 'serve') uiQuest.setText(`📜: 任務 (${questStats.yokaiServed}/${currentQuest.target})`);
        else if (currentQuest.type === 'build') uiQuest.setText(`📜: 任務 (${questStats.buildCount}/${currentQuest.target})`);
        else uiQuest.setText(`📜: ${currentQuest.desc}`);
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

    let centerSx = offsetX + (centerGrid - centerGrid) * halfWidth;
    let centerSy = offsetY + (centerGrid + centerGrid) * halfHeight;
    selfRef.cameras.main.centerOn(centerSx, centerSy);
    selfRef.cameras.main.setZoom(1.0); 

    cursor = this.add.graphics().lineStyle(2, 0xffeaa7, 0.8).setDepth(1600).setVisible(false);
    cursor.beginPath(); cursor.moveTo(0, 0); cursor.lineTo(halfWidth, 16); cursor.lineTo(0, 32); cursor.lineTo(-halfWidth, 16); cursor.closePath(); cursor.strokePath();

    let pinchStartDist = -1; let initialZoom = 1; let pointerDownPos = { x: 0, y: 0 }; let lastDragGrid = { x: -1, y: -1 };

    function attemptPlaceItem(p) {
        if (p.x < 240 && p.y < 300) return; if (p.y < 120 && p.x > 300 && p.x < 500) return; if (p.y < 80 && p.x > 500) return; if (p.x > 620) return; 

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
        } else { activeShopItem = null; uiBuildCancel.setVisible(false); showFloatingText(p.worldX, p.worldY, '資金不足', '#ff7675'); }
    }

    this.input.on('pointerdown', (p) => {
        if(!isGameLoaded) return;
        pointerDownPos.x = p.x; pointerDownPos.y = p.y; lastDragGrid = { x: -1, y: -1 }; 
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
            else { let scale = dist / pinchStartDist; selfRef.cameras.main.setZoom(Phaser.Math.Clamp(initialZoom * scale, 0.1, 2.0)); } 
        } else if (p.isDown) {
            if (activeShopItem) { attemptPlaceItem(p); } 
            else { pinchStartDist = -1; let dx = p.x - p.prevPosition.x; let dy = p.y - p.prevPosition.y; selfRef.cameras.main.scrollX -= dx / selfRef.cameras.main.zoom; selfRef.cameras.main.scrollY -= dy / selfRef.cameras.main.zoom; }
        } else { pinchStartDist = -1; }
    });

    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        if(!isGameLoaded) return;
        let newZoom = selfRef.cameras.main.zoom - (deltaY * 0.001); selfRef.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.1, 2.0));
    });

    this.input.on('pointerup', function (p) {
        if(!isGameLoaded) return;
        pinchStartDist = -1; lastDragGrid = { x: -1, y: -1 };
        if (activeShopItem || Math.abs(p.x - p.downX) > 15 || Math.abs(p.y - p.downY) > 15) return; 
        if (dexPanel || rosterPanel || settingsPanel || expedPanel || (shopPanel && shopPanel.visible)) return; 
        if (p.x < 240 && p.y < 300) return; if (p.y < 80 && p.x > 450 && p.x < 650) return; if (p.x > 590) return; 

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
            
            let teamUI = [];
            function updateExpedStats() {
                let tMult = 1.0, aMult = 1.0, gMult = 1.0;
                selectedTeam.forEach(y => { if(y.id===0) gMult+=0.15; if(y.id===1) tMult-=0.20; if(y.id===2) aMult+=0.30; if(y.id===3) { aMult+=0.10; tMult-=0.10; } });
                let fTime = Math.max(1, Math.floor(baseTime * tMult)); let fAcorn = Math.floor(baseAcorn * aMult); let fGem = Math.floor(baseGem * gMult);
                statsText.setText(`距離: ${dist} km\n預計時間: ${fTime} 秒\n預計掉落: ${fAcorn}🌰 / ${fGem}💎`);
                return { fTime, fAcorn, fGem };
            }
            updateExpedStats();

            let subtitle = selfRef.add.text(0, -35, '👇 選擇出戰隊員 👇', { fontSize: '16px', fill: '#bdc3c7' }).setOrigin(0.5);
            available.forEach((y, idx) => {
                let btnX = -180 + (idx * 80); let btnY = 30;
                let card = selfRef.add.rectangle(btnX, btnY, 60, 60, 0x2c3e50, 1).setStrokeStyle(2, 0xbdc3c7).setInteractive();
                let icon = selfRef.add.text(btnX, btnY, y.emoji, { fontSize: '32px' }).setOrigin(0.5);
                card.on('pointerdown', () => {
                    let fIdx = selectedTeam.findIndex(sy => sy.id === y.id);
                    if (fIdx > -1) { selectedTeam.splice(fIdx, 1); card.setFillStyle(0x2c3e50); card.setStrokeStyle(2, 0xbdc3c7); } 
                    else if (selectedTeam.length < 3) { selectedTeam.push(y); card.setFillStyle(0x27ae60); card.setStrokeStyle(3, 0x55efc4); }
                    updateExpedStats();
                });
                teamUI.push(card, icon);
            });

            if(available.length === 0) teamUI.push(selfRef.add.text(0, 30, '無待命中的夥伴', { fontSize: '16px', fill: '#e74c3c' }).setOrigin(0.5));

            let eBtnYes = selfRef.add.text(-100, 130, '[ 派遣出發 ]', { fontSize: '20px', fill: '#55efc4', backgroundColor: '#27ae60', padding: {x:15,y:8} }).setOrigin(0.5).setInteractive();
            let eBtnNo = selfRef.add.text(100, 130, '[ 放棄 ]', { fontSize: '20px', fill: '#ff7675', backgroundColor: '#c0392b', padding: {x:15,y:8} }).setOrigin(0.5).setInteractive();
            
            eBtnNo.on('pointerdown', (p) => { 
                p.stopPropagation(); 
                selfRef.time.delayedCall(10, () => { if(expedPanel) { expedPanel.destroy(); expedPanel = null; } });
            });
            eBtnYes.on('pointerdown', (p) => {
                p.stopPropagation();
                let finalData = updateExpedStats();
                selectedTeam.forEach(y => { y.state = 'expedition'; });
                activeExpedition = { gx: clickGx, gy: clickGy, sx: sx, sy: sy, dist: dist, timeTotal: finalData.fTime, timeLeft: finalData.fTime, rewardAcorn: finalData.fAcorn, rewardGem: finalData.fGem, state: 'exploring', team: selectedTeam.map(y=>y.id), marker: selfRef.add.text(sx, sy-40, '🎒', {fontSize:'24px'}).setOrigin(0.5).setDepth(1600) };
                selfRef.tweens.add({ targets: activeExpedition.marker, y: sy-50, yoyo: true, repeat: -1, duration: 600 });
                uiExpedTracker.setVisible(true); showFloatingText(480, 270, `探索隊出發！`, '#a29bfe', '24px', true);
                
                selfRef.time.delayedCall(10, () => { if(expedPanel) { expedPanel.destroy(); expedPanel = null; } });
                updateUI();
            });
            expedPanel.add([eBg, eTitle, statsText, subtitle, eBtnYes, eBtnNo, ...teamUI]);
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
            if (targetPool && (targetPool.state === 'waiting_upgrade' || targetPool.state === 'waiting_demolish')) { showFloatingText(p.worldX, p.worldY, '工程排程中', '#f1c40f'); return; }
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

    shopPanel = this.add.container(480, 270).setDepth(3000).setScrollFactor(0).setVisible(false);
    let shopBg = this.add.rectangle(0, 0, 600, 450, 0x2d3436, 0.95).setStrokeStyle(4, 0xf39c12).setInteractive();
    
    let closeBtn = this.add.text(260, -200, '✖', { fontSize: '28px' }).setInteractive();
    closeBtn.on('pointerdown', (p) => {
        p.stopPropagation(); 
        shopPanel.setVisible(false);
    });
    
    shopPanel.add([shopBg, this.add.text(0, -190, t('shopTitle'), { fontSize:'28px', fontStyle:'bold' }).setOrigin(0.5), closeBtn]);
    
    itemDatabase.forEach((item, i) => {
        let rowY = -120 + (i * 55);
        shopPanel.add(this.add.text(-220, rowY, item.emoji, { fontSize:'28px' }).setOrigin(0.5));
        shopPanel.add(this.add.text(-180, rowY, item.name[currentLang], { fontSize:'16px' }).setOrigin(0, 0.5));
        let priceTxt = item.price === 0 ? 'FREE' : `${item.price}${item.currency==='ACORN'?'🌰':'💎'}`;
        shopPanel.add(this.add.text(120, rowY, priceTxt, { fontSize:'16px', fill:'#f1c40f' }).setOrigin(0.5));
        
        let buyBtn = this.add.text(220, rowY, `[ ${t('buy')} ]`, { fontSize:'16px', fill:'#55efc4' }).setInteractive();
        buyBtn.on('pointerdown', (p) => { 
            p.stopPropagation(); 
            activeShopItem = item; 
            shopPanel.setVisible(false); 
            uiBuildCancel.setVisible(true); 
            updateUI(); 
        });
        shopPanel.add(buyBtn);
    });

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

        selfRef.tweens.chain({
            tweens: walkTweens,
            onComplete: function() {
                targetPool.reserved--; targetPool.occupants++;
                
                let affectionBubble = null;
                if(Math.random() < 0.20) { 
                    let isMilk = Math.random() > 0.5;
                    affectionBubble = selfRef.add.text(targetPool.screenX, targetPool.screenY - 50, isMilk ? '🍼' : '🍡', {fontSize:'24px', backgroundColor:'#fff', padding:{x:5,y:5}}).setOrigin(0.5).setInteractive().setDepth(2000);
                    
                    affectionBubble.on('pointerdown', (p) => {
                        p.stopPropagation();
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
                        let baseYield = getYield(targetPool.level); let finalYield = Math.floor(baseYield * (1 + envBonus)); 
                        
                        score += finalYield; selfRef.addExp(Math.floor(finalYield * 0.1)); 
                        
                        let popupText = '+' + finalYield; let popupColor = '#ffeaa7'; let popupSize = '18px';
                        if (envBonus > 0) { popupText += ` (+${Math.floor(envBonus * 100)}%)`; popupColor = '#55efc4'; popupSize = '20px'; }
                        
                        showFloatingText(targetPool.screenX, targetPool.screenY - 40, popupText, popupColor, popupSize);

                        questStats.yokaiServed++; selfRef.checkQuests(); 
                        selfRef.tweens.add({ targets: yokai, x: startSx, y: startSy-100, alpha: 0, duration: 2000, onComplete: () => yokai.destroy() });
                    }
                });
            }
        });
    }, loop: true });

    let btnShopUI = this.add.text(860, 110, t('btnShop'), { fontSize:'18px', backgroundColor:'#e67e22', padding:{x:10,y:10} }).setOrigin(0.5).setInteractive().setDepth(1000).setScrollFactor(0);
    btnShopUI.on('pointerdown', () => { if(isGameLoaded) shopPanel.setVisible(true); });

    let btnRosterUI = this.add.text(860, 170, '🎒', { fontSize:'18px', backgroundColor:'#9b59b6', padding:{x:10,y:10} }).setOrigin(0.5).setInteractive().setDepth(1000).setScrollFactor(0);
    btnRosterUI.on('pointerdown', () => { if(isGameLoaded) openRoster(); });

    let btnFriend = this.add.text(860, 230, '🤝', { fontSize:'18px', backgroundColor:'#16a085', padding:{x:10,y:10} }).setOrigin(0.5).setInteractive().setDepth(1000).setScrollFactor(0);
    let friendCooldown = 0;
    btnFriend.on('pointerdown', () => {
        if(!isGameLoaded) return;
        if(friendCooldown<=0) {
            let assistExp = Math.max(1, playerLevel + Math.floor(Math.random()*3) - 1) * 30; 
            selfRef.addExp(assistExp); selfRef.cameras.main.fadeOut(200,0,0,0);
            selfRef.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                showFloatingText(480, 270, `🤝\n+${assistExp} EXP`, '#55efc4', '24px', true); selfRef.cameras.main.fadeIn(300,0,0,0);
            });
            friendCooldown = 45; btnFriend.setText(`${friendCooldown}s`);
        }
    });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { if(friendCooldown>0){ friendCooldown--; if(friendCooldown<=0) btnFriend.setText('🤝'); else btnFriend.setText(`${friendCooldown}s`); } }});
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
            uiExpedTracker.setText('🎁').setBackgroundColor('rgba(46, 204, 113, 0.8)');
        } else { uiExpedTracker.setText(`🎒 ${Math.ceil(activeExpedition.timeLeft)}s`).setBackgroundColor('rgba(0,0,0,0.7)'); }
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
            let sx = offsetX + (x - y) * halfWidth; let sy = offsetY + (x + y) * halfHeight;
            
            if(tilePool.length > 0) {
                let spr = tilePool.pop();
                spr.setPosition(sx, sy).setDepth(x+y).setVisible(true);
                activeTiles.push(spr);
                
                if (tile.status === -6) spr.setTexture('cliff').setOrigin(0.5, 0);
                else if (tile.status === -2) spr.setTexture('mountain').setOrigin(0.5, 0.9); 
                else if (tile.status === -3) spr.setTexture('river').setOrigin(0.5, 0);
                else if (tile.status === -4) spr.setTexture('waterfall').setOrigin(0.5, 0);
                else spr.setTexture((x+y)%2===0 ? 'grass1' : 'grass2').setOrigin(0.5, 0);
            }

            if (!tile.unlocked && fogPool.length > 0) {
                let fog = fogPool.pop(); fog.setPosition(sx, sy).setDepth(x+y+0.5).setVisible(true); activeFogs.push(fog);
            }

            if (!tile.unlocked && tile.isAdj && tile.status !== -5 && tile.status !== -6 && signPool.length > 0) {
                let sign = signPool.pop(); sign.setPosition(sx, sy-10).setDepth(x+y+0.6).setVisible(true); activeSigns.push(sign);
            }

            if (tile.status === -5 && villagePool.length > 0) {
                let v = villagePool.pop(); v.setPosition(sx, sy-20).setDepth(x+y+0.2).setVisible(true); activeVillages.push(v);
            }
        }
    }
}
