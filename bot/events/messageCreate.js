const db = require('../../database/db');
const config = require('../../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client, dbInstance) {
        if (message.author.bot) return;
        
        const settings = db.getLevelSettings();
        const dbModule = dbInstance || db;
        
        const result = dbModule.addMessage(message.author.id);
        
        const user = dbModule.getUser(message.author.id);
        
        if (result.leveledUp) {
            const levelRoles = config.features.levels?.roles || [];
            const member = message.guild.members.cache.get(message.author.id);
            
            for (const roleData of levelRoles) {
                if (result.level >= roleData.level && roleData.roleId) {
                    const role = message.guild.roles.cache.get(roleData.roleId);
                    if (role && member) {
                        try {
                            await member.roles.add(role);
                        } catch (e) {
                            console.log('Не удалось выдать роль:', e.message);
                        }
                    }
                }
            }
            
            const achievements = config.features.levels?.achievements || [];
            for (const achievement of achievements) {
                if (achievement.type === 'level' && result.level >= achievement.count) {
                    dbModule.addAchievement(message.author.id, 'level', achievement.name, achievement.reward);
                }
                if (achievement.type === 'messages' && user.messages >= achievement.count) {
                    dbModule.addAchievement(message.author.id, 'messages', achievement.name, achievement.reward);
                }
            }
            
            const nextLevelXP = result.level * result.level * 100;
            const embed = {
                color: 0x9b59b6,
                title: '🎉 Уровень повышен!',
                description: `Поздравляем, ${message.author}!`,
                fields: [
                    { name: 'Новый уровень', value: `**${result.level}**`, inline: true },
                    { name: 'XP', value: `${result.xp} / ${nextLevelXP}`, inline: true }
                ],
                thumbnail: { url: message.author.displayAvatarURL() },
                timestamp: new Date().toISOString()
            };
            
            try {
                await message.channel.send({ embeds: [embed] });
            } catch (e) {
                console.log('Не удалось отправить embed:', e.message);
            }
        }
        
        const userUpdated = dbModule.getUser(message.author.id);
        const achievements = config.features.levels?.achievements || [];
        
        for (const achievement of achievements) {
            if (achievement.type === 'messages' && userUpdated.messages >= achievement.count) {
                dbModule.addAchievement(message.author.id, 'messages', achievement.name, achievement.reward);
            }
            if (achievement.type === 'level' && userUpdated.level >= achievement.count) {
                dbModule.addAchievement(message.author.id, 'level', achievement.name, achievement.reward);
            }
        }
    }
};