const { MessageEmbed } = require('discord.js');
const db = require('../../database/db');

module.exports = {
    name: 'streak',
    description: 'Показать серию активности',
    async execute(message, args, client, db) {
        const streak = db.getStreak(message.author.id);
        
        const embed = new MessageEmbed()
            .setColor('#f39c12')
            .setTitle('🔥 Серия активности')
            .addFields(
                { name: 'Дней подряд', value: `${streak.streak || 0} дней`, inline: true },
                { name: 'Последняя награда', value: streak.lastDaily ? new Date(streak.lastDaily).toLocaleDateString() : 'Еще не получал' }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};