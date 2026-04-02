const { MessageEmbed } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config.json');

module.exports = {
    name: 'daily',
    description: 'Получить ежедневную награду',
    async execute(message, args, client, db) {
        const settings = db.getLevelSettings();
        const dailyReward = settings?.daily_reward || 10;
        const streakBonus = settings?.streak_bonus || 5;
        const maxStreakBonus = settings?.max_streak_bonus || 50;
        
        const result = db.claimDailyReward(message.author.id, dailyReward, streakBonus, maxStreakBonus);
        
        const embed = new MessageEmbed();
        
        if (!result.success) {
            embed.setColor('#e74c3c')
                .setTitle('⏰ Подожди!')
                .setDescription(result.message);
        } else {
            embed.setColor('#2ecc71')
                .setTitle('🎁 Ежедневная награда получена!')
                .setDescription(`Поздравляем, ${message.author}!`)
                .addFields(
                    { name: 'Награда', value: `+${result.reward} XP`, inline: true },
                    { name: 'Серия', value: `🔥 ${result.streak} дней`, inline: true },
                    { name: 'Бонус за серию', value: `+${result.streakBonus} XP`, inline: true }
                );
            
            if (result.leveledUp) {
                embed.addFields({ name: '🎉 Новый уровень!', value: `Теперь уровень: **${result.newLevel}**` });
            }
        }
        
        embed.setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};