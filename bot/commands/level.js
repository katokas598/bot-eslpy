const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'level',
    description: 'Показать ваш уровень',
    async execute(message, args, client, db) {
        const user = db.getUser(message.author.id);
        
        const embed = new MessageEmbed()
            .setColor('#9b59b6')
            .setTitle(`📊 Уровень ${message.author.username}`)
            .addFields(
                { name: 'Уровень', value: String(user.level), inline: true },
                { name: 'XP', value: `${user.xp} / ${user.level * user.level * 100}`, inline: true },
                { name: 'Сообщений', value: String(user.messages), inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};