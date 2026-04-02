const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'Информация о сервере',
    async execute(message, args, client, db) {
        const guild = message.guild;
        
        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Участников', value: String(guild.memberCount), inline: true },
                { name: 'Каналов', value: String(guild.channels.cache.size), inline: true },
                { name: 'Ролей', value: String(guild.roles.cache.size), inline: true },
                { name: 'Создан', value: guild.createdAt.toLocaleDateString(), inline: true },
                { name: 'ID', value: guild.id, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};