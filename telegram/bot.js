const TelegramBot = require('node-telegram-bot-api');
const config = require('../config.json');
const db = require('../database/db');

const bot = new TelegramBot(config.telegram.token, { polling: true });

const adminId = config.telegram.admin_id;

function isAdmin(msg) {
    return String(msg.from.id) === String(adminId);
}

function mainMenu() {
    return {
        reply_markup: JSON.stringify({
            keyboard: [
                ['📊 Статус', '🛡 Модерация'],
                ['📢 Рассылка', '⚙️ Настройки'],
                ['🔄 Перезагрузить', '📜 Логи']
            ],
            resize_keyboard: true
        })
    };
}

bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg)) {
        bot.sendMessage(msg.chat.id, '⛔ Доступ запрещен');
        return;
    }
    
    bot.sendMessage(msg.chat.id, '👋 Управление ботом', mainMenu());
});

bot.onText(/📊 Статус/, (msg) => {
    if (!isAdmin(msg)) return;
    
    const stats = db.getAllStats();
    const status = `
📊 *Статус бота*

✅ Бот запущен
👥 Пользователей: ${stats.totalUsers}
💬 Сообщений: ${stats.totalMessages}
⚠️ Предупреждений: ${stats.totalWarnings}
🔨 Банов: ${stats.totalBans}
🎫 Тикетов: ${stats.totalTickets}
    `;
    
    bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
});

bot.onText(/🛡 Модерация/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Выберите действие:', {
        reply_markup: JSON.stringify({
            keyboard: [
                ['📋 Список банов', '⚠️ Список варнов'],
                ['🔙 Назад']
            ],
            resize_keyboard: true
        })
    });
});

bot.onText(/📋 Список банов/, (msg) => {
    if (!isAdmin(msg)) return;
    
    const bans = db.getBans('all');
    let text = '📋 *Последние баны:*\n\n';
    
    if (bans.length === 0) {
        text += 'Нет банов';
    } else {
        bans.slice(0, 10).forEach((ban, i) => {
            text += `${i + 1}. User: ${ban.user_id}\nПричина: ${ban.reason}\n\n`;
        });
    }
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/⚠️ Список варнов/, (msg) => {
    if (!isAdmin(msg)) return;
    
    const warnings = db.prepare('SELECT * FROM warnings ORDER BY created_at DESC LIMIT 20').all();
    let text = '⚠️ *Последние предупреждения:*\n\n';
    
    if (warnings.length === 0) {
        text += 'Нет предупреждений';
    } else {
        warnings.forEach((w, i) => {
            text += `${i + 1}. User: ${w.user_id}\nПричина: ${w.reason}\n\n`;
        });
    }
    
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

bot.onText(/📢 Рассылка/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Введите сообщение для рассылки:');
    
    bot.once('message', (msg2) => {
        if (!isAdmin(msg2)) return;
        
        const client = require('../bot/index');
        if (client && client.guilds) {
            client.guilds.cache.forEach(guild => {
                const channel = guild.systemChannel;
                if (channel) {
                    channel.send(msg2.text).catch(() => {});
                }
            });
        }
        
        bot.sendMessage(msg.chat.id, '✅ Рассылка отправлена!');
    });
});

bot.onText(/⚙️ Настройки/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Выберите настройку:', {
        reply_markup: JSON.stringify({
            keyboard: [
                ['📝 Изменить префикс', '🔧 Изменить канал логов'],
                ['🔙 Назад']
            ],
            resize_keyboard: true
        })
    });
});

bot.onText(/📝 Изменить префикс/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Введите новый префикс:');
    
    bot.once('message', (msg2) => {
        if (!isAdmin(msg2)) return;
        
        db.updateGuildSettings('default', { prefix: msg2.text });
        bot.sendMessage(msg.chat.id, `✅ Префикс изменен на: ${msg2.text}`);
    });
});

bot.onText(/🔧 Изменить канал логов/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Введите ID канала для логов:');
    
    bot.once('message', (msg2) => {
        if (!isAdmin(msg2)) return;
        
        db.updateGuildSettings('default', { log_channel: msg2.text });
        bot.sendMessage(msg.chat.id, `✅ Канал логов установлен: ${msg2.text}`);
    });
});

bot.onText(/🔄 Перезагрузить/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, '🔄 Перезагрузка бота...');
    process.exit(1);
});

bot.onText(/📜 Логи/, (msg) => {
    if (!isAdmin(msg)) return;
    
    const stats = db.getAllStats();
    const logs = `
📜 *Последние действия:*

Всего пользователей: ${stats.totalUsers}
Всего сообщений: ${stats.totalMessages}
Банов: ${stats.totalBans}
Предупреждений: ${stats.totalWarnings}
    `;
    
    bot.sendMessage(msg.chat.id, logs, { parse_mode: 'Markdown' });
});

bot.onText(/🔙 Назад/, (msg) => {
    if (!isAdmin(msg)) return;
    
    bot.sendMessage(msg.chat.id, 'Главное меню', mainMenu());
});

console.log('[Telegram] Бот управления запущен');

module.exports = bot;