const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('../config.json');
const db = require('../database/db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

async function startServer() {
    await db.initDB();
    console.log('[Database] SQLite инициализирован');
    
    app.get('/', (req, res) => {
        const stats = db.getAllStats();
        res.render('index', { stats });
    });

    app.get('/users', (req, res) => {
        const users = db.getLeaderboard(100);
        res.render('users', { users });
    });

    app.get('/moderation', (req, res) => {
        const bans = db.getBans('all');
        const warnings = db.prepare('SELECT * FROM warnings ORDER BY created_at DESC LIMIT 50');
        const warningList = [];
        while (warnings.step()) warningList.push(warnings.getAsObject());
        warnings.free();
        res.render('moderation', { bans, warnings: warningList });
    });

    app.get('/settings', (req, res) => {
        const levelSettings = db.getLevelSettings();
        const achievements = config.features.levels?.achievements || [];
        const roles = config.features.levels?.roles || [];
        res.render('settings', { levelSettings, achievements, roles });
    });

    app.post('/settings', (req, res) => {
        const { prefix, welcome_channel, log_channel, welcome_message } = req.body;
        db.updateGuildSettings('default', {
            prefix,
            welcome_channel,
            log_channel,
            welcome_message
        });
        res.redirect('/settings');
    });

    app.get('/tickets', (req, res) => {
        const tickets = db.getTickets('all');
        res.render('tickets', { tickets });
    });

    app.get('/levels', (req, res) => {
        const levelSettings = db.getLevelSettings();
        const achievements = config.features.levels?.achievements || [];
        const roles = config.features.levels?.roles || [];
        const weeklyTop = db.getWeeklyTop(10);
        const monthlyTop = db.getMonthlyTop(10);
        const allTimeTop = db.getLeaderboard(10);
        res.render('levels', { 
            levelSettings, 
            achievements, 
            roles,
            weeklyTop,
            monthlyTop,
            allTimeTop
        });
    });

    app.post('/api/levels', (req, res) => {
        const { 
            xp_per_message, 
            xp_per_voice_minute, 
            daily_reward, 
            streak_bonus, 
            max_streak_bonus 
        } = req.body;
        
        db.updateLevelSettings({
            xp_per_message: parseInt(xp_per_message) || 1,
            xp_per_voice_minute: parseInt(xp_per_voice_minute) || 2,
            daily_reward: parseInt(daily_reward) || 10,
            streak_bonus: parseInt(streak_bonus) || 5,
            max_streak_bonus: parseInt(max_streak_bonus) || 50
        });
        
        res.json({ success: true, message: 'Настройки сохранены!' });
    });

    app.get('/api/leaderboard/weekly', (req, res) => {
        const top = db.getWeeklyTop(10);
        res.json(top);
    });

    app.get('/api/leaderboard/monthly', (req, res) => {
        const top = db.getMonthlyTop(10);
        res.json(top);
    });

    app.get('/api/leaderboard/alltime', (req, res) => {
        const top = db.getLeaderboard(10);
        res.json(top);
    });

    app.get('/api/levels/settings', (req, res) => {
        const settings = db.getLevelSettings();
        res.json(settings);
    });

    const PORT = config.dashboard.port || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Dashboard] Сервер запущен на порту ${PORT}`);
        console.log(`[Dashboard] Доступ: http://zyc-discord.duckdns.org:${PORT}`);
    });
}

startServer().catch(console.error);

module.exports = app;