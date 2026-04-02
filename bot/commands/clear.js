const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Очистить сообщения',
    usage: '<количество>',
    async execute(message, args, client, db) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply('❌ У вас нет прав!');
        }

        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Укажите число от 1 до 100');
        }

        try {
            const deleted = await message.channel.bulkDelete(amount + 1, true);
            const embed = new MessageEmbed()
                .setColor('#2ecc71')
                .setTitle('🧹 Очищено')
                .setDescription(`Удалено ${deleted.size - 1} сообщений`);
            message.reply({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 3000));
        } catch (e) {
            message.reply('❌ Не удалось удалить сообщения');
        }
    }
};