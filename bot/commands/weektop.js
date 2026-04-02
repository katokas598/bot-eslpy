const { MessageEmbed } = require('discord.js');
const db = require('../database/db');

module.exports = {
    name: 'weektop',
    description: 'Топ пользователей за неделю',
    async execute(message, args, client, db) {
        const top = db.getWeeklyTop(10);
        
        let description = '';
        top.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            description += `${medal} <@${user.user_id}> - ${user.weekly_xp} XP (Level ${user.level})\n`;
        });
        
        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle('📊 Топ за неделю')
            .setDescription(description || 'Пока нет данных')
            .setFooter({ text: 'XP обновляется каждую неделю' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};