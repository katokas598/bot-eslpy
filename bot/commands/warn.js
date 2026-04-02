const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'warn',
    description: 'Выдать предупреждение',
    usage: '<пользователь> [причина]',
    async execute(message, args, client, db) {
        if (!message.member.permissions.has('MUTE_MEMBERS')) {
            return message.reply('❌ У вас нет прав!');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Укажите пользователя!');

        const reason = args.slice(1).join(' ') || 'Не указана';

        db.addWarning(user.id, message.author.id, reason, message.guild.id);
        
        const warnings = db.getWarnings(user.id);

        const embed = new MessageEmbed()
            .setColor('#f1c40f')
            .setTitle('⚠️ Предупреждение выдано')
            .addFields(
                { name: 'Пользователь', value: user.tag, inline: true },
                { name: 'Модератор', value: message.author.tag, inline: true },
                { name: 'Причина', value: reason },
                { name: 'Всего предупреждений', value: String(warnings.length) }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};