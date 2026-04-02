const { MessageEmbed } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    name: 'monthtop',
    description: 'Топ пользователей за месяц',
    async execute(message, args, client, db) {
        const top = db.getMonthlyTop(10);
        
        let description = '';
        top.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            description += `${medal} <@${user.user_id}> - ${user.monthly_xp} XP (Level ${user.level})\n`;
        });
        
        const embed = new MessageEmbed()
            .setColor('#9b59b6')
            .setTitle('📈 Топ за месяц')
            .setDescription(description || 'Пока нет данных')
            .setFooter({ text: 'XP обновляется каждый месяц' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};