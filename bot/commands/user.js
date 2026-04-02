const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'user',
    description: 'Информация о пользователе',
    usage: '[пользователь]',
    async execute(message, args, client, db) {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        const userData = db.getUser(user.id);

        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle(`👤 ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Уровень', value: String(userData.level), inline: true },
                { name: 'XP', value: String(userData.xp), inline: true },
                { name: 'Сообщений', value: String(userData.messages), inline: true },
                { name: 'Предупреждений', value: String(userData.warnings), inline: true },
                { name: 'Роль', value: member?.roles.highest?.name || 'Нет', inline: true },
                { name: 'Присоединился', value: member?.joinedAt?.toLocaleDateString() || 'Неизвестно' }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};