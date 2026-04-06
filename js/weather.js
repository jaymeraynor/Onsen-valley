// ==========================================
// 【天氣系統模組】Weather System Module
// ==========================================
const WeatherSystem = {
    snow: null,
    sakura: null,
    current: 'clear',

    init: function(scene) {
        this.snow = scene.add.particles(0, 0, 'snowParticle', {
            x: { min: -200, max: 1000 }, y: -50,
            lifespan: 6000,
            speedY: { min: 30, max: 80 }, speedX: { min: -20, max: 20 },
            scale: { min: 0.3, max: 1.0 }, alpha: { start: 0.8, end: 0 },
            quantity: 2, blendMode: 'NORMAL'
        }).setDepth(1900).setScrollFactor(0).stop();

        this.sakura = scene.add.particles(0, 0, 'sakuraParticle', {
            x: { min: -400, max: 800 }, y: -50,
            lifespan: 7000,
            speedY: { min: 40, max: 90 }, speedX: { min: 50, max: 120 }, 
            rotate: { min: 0, max: 360 }, scale: { min: 0.6, max: 1.2 }, 
            alpha: { start: 1, end: 0 },
            quantity: 1, blendMode: 'NORMAL'
        }).setDepth(1900).setScrollFactor(0).stop();

        scene.time.addEvent({ delay: 60000, loop: true, callback: () => this.changeWeather(scene) });
        
        scene.time.delayedCall(8000, () => {
            if (!isGameLoaded || !userSettings.vfx) return;
            this.current = Math.random() > 0.5 ? 'snow' : 'sakura';
            if(this.current === 'snow') this.snow.start(); else this.sakura.start();
            showFloatingText(400, 150, this.current === 'snow' ? '❄️ 湯之谷的初雪...' : '🌸 櫻花季開始了...', this.current === 'snow' ? '#81ecec' : '#ff9ff3', '24px', true);
        });
    },

    changeWeather: function(scene) {
        if (!isGameLoaded || !userSettings.vfx) return; 
        let weathers = ['clear', 'snow', 'sakura'];
        let nextWeather = Phaser.Utils.Array.GetRandom(weathers);
        if (nextWeather === this.current) return;
        this.current = nextWeather;

        this.snow.stop(); this.sakura.stop();
        let msg = '', color = '#fff';

        if (this.current === 'snow') {
            this.snow.start(); msg = '❄️ 寒流來襲，下雪了...'; color = '#81ecec';
        } else if (this.current === 'sakura') {
            this.sakura.start(); msg = '🌸 微風徐徐，櫻花飛舞...'; color = '#ff9ff3';
        } else {
            msg = '☀️ 天氣放晴了'; color = '#ffeaa7';
        }
        showFloatingText(400, 150, msg, color, '20px', true);
    },

    applySettings: function() {
        if (userSettings.vfx && this.current) {
            if (this.current === 'snow') this.snow.start();
            if (this.current === 'sakura') this.sakura.start();
        } else {
            if(this.snow) this.snow.stop();
            if(this.sakura) this.sakura.stop();
        }
    }
};
