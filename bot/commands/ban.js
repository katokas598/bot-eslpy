const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Забанить пользователя',
    usage: '<пользователь> [причина]',
    async execute(message, args, client, db) {
        if (!message.member.permissions.has('BAN_MEMBERS')) {
            return message.reply('❌ У вас нет прав для бана!');
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply('❌ Пользователь не найден!');

        const reason = args.slice(1).join(' ') || 'Не указана';
        
        try {
            const member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user.id).catch(() => null);
            if (member) {
                if (member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
                    return message.reply('❌ Вы не можете забанить этого пользователя!');
                }
                await member.ban({ reason: `${reason} | by ${message.author.tag}` });
            }

            db.banUser(user.id, message.author.id, reason, message.guild.id);

            const embed = new MessageEmbed()
                .setColor('#e74c3c')
                .setTitle('🔨 Пользователь забанен')
                .addFields(
                    { name: 'Пользователь', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Модератор', value: message.author.tag, inline: true },
                    { name: 'Причина', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });

            const settings = db.getGuildSettings(message.guild.id);
            if (settings.log_channel) {
                const logChannel = message.guild.channels.cache.get(settings.log_channel);
                if (logChannel) {
                    logChannel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            message.reply('❌ Не удалось забанить пользователя!');
        }
    }
};