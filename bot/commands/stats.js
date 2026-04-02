const { MessageEmbed } = require('discord.js');
const db = require('../database/db');

module.exports = {
    name: 'stats',
    description: 'Статистика сервера',
    async execute(message, args, client, db) {
        const stats = db.getAllStats();
        
        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle('📊 Статистика бота')
            .addFields(
                { name: 'Всего пользователей', value: String(stats.totalUsers), inline: true },
                { name: 'Всего сообщений', value: String(stats.totalMessages), inline: true },
                { name: 'Предупреждений', value: String(stats.totalWarnings), inline: true },
                { name: 'Банов', value: String(stats.totalBans), inline: true },
                { name: 'Тикетов', value: String(stats.totalTickets), inline: true },
                { name: 'Серверов', value: String(client.guilds.cache.size), inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};