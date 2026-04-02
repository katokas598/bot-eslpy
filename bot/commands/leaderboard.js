const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    description: 'Топ пользователей по XP',
    async execute(message, args, client, db) {
        const top = db.getLeaderboard(10);
        
        let description = '';
        top.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            description += `${medal} <@${user.user_id}> - Level ${user.level} (${user.xp} XP)\n`;
        });
        
        const embed = new MessageEmbed()
            .setColor('#f1c40f')
            .setTitle('🏆 Топ пользователей')
            .setDescription(description || 'Пока нет данных')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};