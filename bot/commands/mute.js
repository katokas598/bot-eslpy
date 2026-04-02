const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Замутить пользователя',
    usage: '<пользователь> <время> [причина]',
    async execute(message, args, client, db) {
        if (!message.member.permissions.has('MUTE_MEMBERS')) {
            return message.reply('❌ У вас нет прав для мута!');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Укажите пользователя!');

        const timeString = args[1];
        const timeMap = { 's': 1, 'm': 60, 'h': 3600, 'd': 86400 };
        const timeUnit = timeString?.slice(-1);
        const timeValue = parseInt(timeString?.slice(0, -1));

        if (!timeUnit || !timeMap[timeUnit] || !timeValue) {
            return message.reply('❌ Укажите время в формате: 10s, 5m, 1h, 1d');
        }

        const duration = timeValue * timeMap[timeUnit];
        const reason = args.slice(2).join(' ') || 'Не указана';

        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('❌ Пользователь не найден на сервере!');

        try {
            const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted') || 
                await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    permissions: 0
                });

            await member.roles.add(muteRole);

            db.muteUser(user.id, message.author.id, reason, message.guild.id, new Date(Date.now() + duration * 1000));

            setTimeout(async () => {
                if (member.roles.cache.has(muteRole.id)) {
                    await member.roles.remove(muteRole);
                }
            }, duration * 1000);

            const embed = new MessageEmbed()
                .setColor('#f39c12')
                .setTitle('🔇 Пользователь замучен')
                .addFields(
                    { name: 'Пользователь', value: user.tag, inline: true },
                    { name: 'Модератор', value: message.author.tag, inline: true },
                    { name: 'Время', value: timeString, inline: true },
                    { name: 'Причина', value: reason }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            message.reply('❌ Не удалось замутить пользователя!');
        }
    }
};