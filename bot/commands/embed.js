const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'embed',
    description: 'Создать embed сообщение',
    usage: '<заголовок> | <текст>',
    async execute(message, args, client, db) {
        const content = args.join(' ').split('|');
        if (content.length < 2) {
            return message.reply('❌ Используйте: !embed <заголовок> | <текст>');
        }

        const title = content[0].trim();
        const description = content[1].trim();

        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle(title)
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: `Создано: ${message.author.username}` });

        message.channel.send({ embeds: [embed] });
        message.delete();
    }
};