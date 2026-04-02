const { MessageEmbed } = require('discord.js');
const db = require('../database/db');
const config = require('../../config.json');

module.exports = {
    name: 'rewards',
    description: 'Показать доступные награды',
    async execute(message, args, client, db) {
        const achievements = config.features.levels?.achievements || [];
        const userAchievements = db.getAchievements(message.author.id);
        const user = db.getUser(message.author.id);
        
        const earnedNames = userAchievements.map(a => a.achievement_name);
        
        let description = '';
        
        const grouped = {
            messages: achievements.filter(a => a.type === 'messages'),
            level: achievements.filter(a => a.type === 'level'),
            streak: achievements.filter(a => a.type === 'streak')
        };
        
        for (const [type, items] of Object.entries(grouped)) {
            if (items.length > 0) {
                description += `**${type === 'messages' ? '💬 Сообщения' : type === 'level' ? '⬆️ Уровни' : '🔥 Серия'}:**\n`;
                
                for (const item of items) {
                    const isEarned = earnedNames.includes(item.name);
                    const progress = type === 'messages' ? user.messages : type === 'level' ? user.level : 0;
                    const need = item.count;
                    const progressPercent = Math.min((progress / need) * 100, 100);
                    
                    description += `${isEarned ? '✅' : '⬜'} **${item.name}** - ${item.reward} XP (${progress}/${need})\n`;
                    if (!isEarned && progress > 0) {
                        description += `   ████████░░░░░░░░░ ${Math.round(progressPercent)}%\n`;
                    }
                }
                description += '\n';
            }
        }
        
        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle('🎯 Достижения и награды')
            .setDescription(description)
            .setFooter({ text: `Заработано достижений: ${userAchievements.length}` })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};