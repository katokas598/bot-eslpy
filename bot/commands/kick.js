const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Кикнуть пользователя',
    usage: '<пользователь> [причина]',
    async execute(message, args, client, db) {
        if (!message.member.permissions.has('KICK_MEMBERS')) {
            return message.reply('❌ У вас нет прав для кика!');
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply('❌ Пользователь не найден!');

        const reason = args.slice(1).join(' ') || 'Не указана';
        
        try {
            const member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return message.reply('❌ Пользователь не найден на сервере!');
            
            if (member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id) {
                return message.reply('❌ Вы не можете кикнуть этого пользователя!');
            }

            await member.kick(`${reason} | by ${message.author.tag}`);

            const embed = new MessageEmbed()
                .setColor('#e74c3c')
                .setTitle('👢 Пользователь кикнут')
                .addFields(
                    { name: 'Пользователь', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Модератор', value: message.author.tag, inline: true },
                    { name: 'Причина', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Не удалось кикнуть пользователя!');
        }
    }
};