const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'bot.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

async function initDB() {
    const SQL = await initSqlJs();
    
    let data = null;
    if (fs.existsSync(dbPath)) {
        data = fs.readFileSync(dbPath);
    }
    
    db = new SQL.Database(data);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            messages INTEGER DEFAULT 0,
            voice_time INTEGER DEFAULT 0,
            warnings INTEGER DEFAULT 0,
            bans INTEGER DEFAULT 0,
            mutes INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            last_daily DATETIME,
            last_message DATETIME,
            weekly_xp INTEGER DEFAULT 0,
            monthly_xp INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            achievement_type TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            reward INTEGER DEFAULT 0,
            achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, achievement_type, achievement_name)
        );

        CREATE TABLE IF NOT EXISTS level_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            old_level INTEGER NOT NULL,
            new_level INTEGER NOT NULL,
            xp_total INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            reason TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            reason TEXT,
            guild_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS mutes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            reason TEXT,
            guild_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS music_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            track_url TEXT NOT NULL,
            track_title TEXT NOT NULL,
            requested_by TEXT NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS guild_settings (
            guild_id TEXT PRIMARY KEY,
            welcome_channel TEXT,
            log_channel TEXT,
            prefix TEXT DEFAULT '!',
            welcome_message TEXT,
            leave_message TEXT,
            level_roles TEXT
        );

        CREATE TABLE IF NOT EXISTS level_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            xp_per_message INTEGER DEFAULT 1,
            xp_per_voice_minute INTEGER DEFAULT 2,
            daily_reward INTEGER DEFAULT 10,
            streak_bonus INTEGER DEFAULT 5,
            max_streak_bonus INTEGER DEFAULT 50,
            level_roles TEXT,
            achievements TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    const settingsCheck = db.prepare('SELECT * FROM level_settings LIMIT 1');
    if (!settingsCheck.step()) {
        db.run(`INSERT INTO level_settings (xp_per_message, xp_per_voice_minute, daily_reward, streak_bonus, max_streak_bonus) VALUES (1, 2, 10, 5, 50)`);
    }
    settingsCheck.free();
    
    saveDB();
    return db;
}

function saveDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

function getUser(userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
    stmt.bind([userId]);
    let user = null;
    if (stmt.step()) {
        user = stmt.getAsObject();
    }
    stmt.free();
    
    if (!user) {
        db.run('INSERT INTO users (user_id, username) VALUES (?, ?)', [userId, 'Unknown']);
        saveDB();
        return getUser(userId);
    }
    return user;
}

function addXP(userId, amount, reason = 'message') {
    const user = getUser(userId);
    const oldLevel = user.level;
    const newXP = user.xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    const leveledUp = newLevel > oldLevel;
    
    db.run('UPDATE users SET xp = ?, level = ?, weekly_xp = weekly_xp + ?, monthly_xp = monthly_xp + ? WHERE user_id = ?', 
        [newXP, newLevel, amount, amount, userId]);
    
    if (leveledUp) {
        db.run('INSERT INTO level_history (user_id, old_level, new_level, xp_total) VALUES (?, ?, ?, ?)',
            [userId, oldLevel, newLevel, newXP]);
    }
    
    saveDB();
    
    return { xp: newXP, level: newLevel, leveledUp, oldLevel };
}

function addMessage(userId) {
    const user = getUser(userId);
    db.run('UPDATE users SET messages = messages + 1, last_message = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);
    saveDB();
    return addXP(userId, 1, 'message');
}

function addVoiceTime(userId, minutes) {
    const user = getUser(userId);
    db.run('UPDATE users SET voice_time = voice_time + ? WHERE user_id = ?', [minutes, userId]);
    saveDB();
    return addXP(userId, minutes * 2, 'voice');
}

function canClaimDaily(userId) {
    const user = getUser(userId);
    if (!user.last_daily) return true;
    
    const lastDaily = new Date(user.last_daily);
    const now = new Date();
    const hoursDiff = (now - lastDaily) / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
}

function claimDailyReward(userId, dailyReward = 10, streakBonus = 5, maxStreakBonus = 50) {
    const user = getUser(userId);
    const now = new Date();
    
    let streak = user.streak || 0;
    let bonusXp = 0;
    
    if (user.last_daily) {
        const lastDaily = new Date(user.last_daily);
        const hoursDiff = (now - lastDaily) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24 && hoursDiff < 48) {
            streak++;
        } else if (hoursDiff >= 48) {
            streak = 1;
        } else {
            return { success: false, message: 'Подожди 24 часа!' };
        }
    } else {
        streak = 1;
    }
    
    const streakBonusXp = Math.min(streak * streakBonus, maxStreakBonus);
    const totalReward = dailyReward + streakBonusXp;
    
    const result = addXP(userId, totalReward, 'daily');
    db.run('UPDATE users SET last_daily = CURRENT_TIMESTAMP, streak = ? WHERE user_id = ?', [streak, userId]);
    saveDB();
    
    return {
        success: true,
        reward: totalReward,
        streak: streak,
        streakBonus: streakBonusXp,
        newLevel: result.level,
        leveledUp: result.leveledUp
    };
}

function getStreak(userId) {
    const user = getUser(userId);
    return {
        streak: user.streak || 0,
        lastDaily: user.last_daily
    };
}

function addAchievement(userId, type, name, reward) {
    try {
        db.run('INSERT OR IGNORE INTO user_achievements (user_id, achievement_type, achievement_name, reward) VALUES (?, ?, ?, ?)',
            [userId, type, name, reward]);
        
        const checkStmt = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_name = ?');
        checkStmt.bind([userId, name]);
        const exists = checkStmt.step();
        checkStmt.free();
        
        if (exists && reward > 0) {
            addXP(userId, reward, 'achievement');
            return true;
        }
        saveDB();
        return false;
    } catch (e) {
        return false;
    }
}

function getAchievements(userId) {
    const stmt = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY achieved_at DESC');
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function getWeeklyTop(limit = 10) {
    const stmt = db.prepare('SELECT * FROM users ORDER BY weekly_xp DESC LIMIT ?');
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function getMonthlyTop(limit = 10) {
    const stmt = db.prepare('SELECT * FROM users ORDER BY monthly_xp DESC LIMIT ?');
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function getLevelHistory(userId, limit = 5) {
    const stmt = db.prepare('SELECT * FROM level_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
    stmt.bind([userId, limit]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function resetWeeklyXP() {
    db.run('UPDATE users SET weekly_xp = 0');
    saveDB();
}

function resetMonthlyXP() {
    db.run('UPDATE users SET monthly_xp = 0');
    saveDB();
}

function getLevelSettings() {
    const stmt = db.prepare('SELECT * FROM level_settings LIMIT 1');
    let settings = null;
    if (stmt.step()) {
        settings = stmt.getAsObject();
    }
    stmt.free();
    return settings;
}

function updateLevelSettings(data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    db.run(`UPDATE level_settings SET ${fields} WHERE id = 1`, values);
    saveDB();
}

function addWarning(userId, moderatorId, reason, guildId) {
    db.run('INSERT INTO warnings (user_id, moderator_id, reason, guild_id) VALUES (?, ?, ?, ?)', [userId, moderatorId, reason, guildId]);
    db.run('UPDATE users SET warnings = warnings + 1 WHERE user_id = ?', [userId]);
    saveDB();
}

function getWarnings(userId) {
    const stmt = db.prepare('SELECT * FROM warnings WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function banUser(userId, moderatorId, reason, guildId, expiresAt = null) {
    db.run('INSERT INTO bans (user_id, moderator_id, reason, guild_id, expires_at) VALUES (?, ?, ?, ?, ?)', [userId, moderatorId, reason, guildId, expiresAt]);
    db.run('UPDATE users SET bans = bans + 1 WHERE user_id = ?', [userId]);
    saveDB();
}

function getBans(guildId) {
    const stmt = db.prepare('SELECT * FROM bans ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function muteUser(userId, moderatorId, reason, guildId, expiresAt = null) {
    db.run('INSERT INTO mutes (user_id, moderator_id, reason, guild_id, expires_at) VALUES (?, ?, ?, ?, ?)', [userId, moderatorId, reason, guildId, expiresAt]);
    db.run('UPDATE users SET mutes = mutes + 1 WHERE user_id = ?', [userId]);
    saveDB();
}

function getMutes(guildId) {
    const stmt = db.prepare('SELECT * FROM mutes ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function createTicket(userId, channelId, guildId) {
    db.run('INSERT INTO tickets (user_id, channel_id, guild_id) VALUES (?, ?, ?)', [userId, channelId, guildId]);
    saveDB();
    const stmt = db.prepare('SELECT * FROM tickets WHERE channel_id = ?');
    stmt.bind([channelId]);
    let ticket = null;
    if (stmt.step()) {
        ticket = stmt.getAsObject();
    }
    stmt.free();
    return ticket;
}

function getTickets(guildId) {
    const stmt = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC');
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function closeTicket(channelId) {
    db.run('UPDATE tickets SET status = ? WHERE channel_id = ?', ['closed', channelId]);
    saveDB();
}

function getSetting(key) {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);
    let value = null;
    if (stmt.step()) {
        value = stmt.getAsObject().value;
    }
    stmt.free();
    return value;
}

function setSetting(key, value) {
    db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    saveDB();
}

function addToQueue(guildId, trackUrl, trackTitle, requestedBy) {
    db.run('INSERT INTO music_queue (guild_id, track_url, track_title, requested_by) VALUES (?, ?, ?, ?)', [guildId, trackUrl, trackTitle, requestedBy]);
    saveDB();
}

function getQueue(guildId) {
    const stmt = db.prepare('SELECT * FROM music_queue WHERE guild_id = ? ORDER BY added_at');
    stmt.bind([guildId]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function removeFromQueue(id) {
    db.run('DELETE FROM music_queue WHERE id = ?', [id]);
    saveDB();
}

function clearQueue(guildId) {
    db.run('DELETE FROM music_queue WHERE guild_id = ?', [guildId]);
    saveDB();
}

function getGuildSettings(guildId) {
    const stmt = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
    stmt.bind([guildId]);
    let settings = null;
    if (stmt.step()) {
        settings = stmt.getAsObject();
    }
    stmt.free();
    
    if (!settings) {
        db.run('INSERT INTO guild_settings (guild_id) VALUES (?)', [guildId]);
        saveDB();
        return getGuildSettings(guildId);
    }
    return settings;
}

function updateGuildSettings(guildId, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    values.push(guildId);
    db.run(`UPDATE guild_settings SET ${fields} WHERE guild_id = ?`, values);
    saveDB();
}

function getLeaderboard(limit = 10) {
    const stmt = db.prepare('SELECT * FROM users ORDER BY xp DESC LIMIT ?');
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function getAllStats() {
    let totalUsers = 0, totalMessages = 0;
    
    let stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    if (stmt.step()) totalUsers = stmt.getAsObject().count;
    stmt.free();
    
    stmt = db.prepare('SELECT SUM(messages) as total FROM users');
    if (stmt.step()) totalMessages = stmt.getAsObject().total || 0;
    stmt.free();
    
    stmt = db.prepare('SELECT COUNT(*) as count FROM warnings');
    const totalWarnings = stmt.step() ? stmt.getAsObject().count : 0;
    stmt.free();
    
    stmt = db.prepare('SELECT COUNT(*) as count FROM bans');
    const totalBans = stmt.step() ? stmt.getAsObject().count : 0;
    stmt.free();
    
    stmt = db.prepare('SELECT COUNT(*) as count FROM tickets');
    const totalTickets = stmt.step() ? stmt.getAsObject().count : 0;
    stmt.free();
    
    return { totalUsers, totalMessages, totalWarnings, totalBans, totalTickets };
}

function prepare(sql) {
    return db.prepare(sql);
}

module.exports = {
    initDB,
    getUser,
    addXP,
    addMessage,
    addVoiceTime,
    canClaimDaily,
    claimDailyReward,
    getStreak,
    addAchievement,
    getAchievements,
    getWeeklyTop,
    getMonthlyTop,
    getLevelHistory,
    resetWeeklyXP,
    resetMonthlyXP,
    getLevelSettings,
    updateLevelSettings,
    addWarning,
    getWarnings,
    banUser,
    getBans,
    muteUser,
    getMutes,
    createTicket,
    getTickets,
    closeTicket,
    getSetting,
    setSetting,
    addToQueue,
    getQueue,
    removeFromQueue,
    clearQueue,
    getGuildSettings,
    updateGuildSettings,
    getLeaderboard,
    getAllStats,
    prepare
};