const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Проверить пинг бота',
    async execute(message, args, client, db) {
        const ping = Date.now() - message.createdTimestamp;
        const apiPing = client.ws.ping;
        
        const embed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle('🏓 Пинг')
            .addFields(
                { name: 'Задержка', value: `${ping}ms`, inline: true },
                { name: 'API пинг', value: `${apiPing}ms`, inline: true }
            );
        
        message.reply({ embeds: [embed] });
    }
};