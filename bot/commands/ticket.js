const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Создать тикет',
    usage: '[причина]',
    async execute(message, args, client, db) {
        const reason = args.join(' ') || 'Без описания';
        
        const ticketRoles = db.getTicketRoles(message.guild.id);
        let roleMentions = '';
        if (ticketRoles && ticketRoles.length > 0) {
            const validRoles = ticketRoles
                .map(roleId => message.guild.roles.cache.get(roleId))
                .filter(role => role);
            if (validRoles.length > 0) {
                roleMentions = validRoles.map(r => r.toString()).join(' ');
            }
        }
        
        const ticketChannel = await message.guild.channels.create(`ticket-${message.author.username}`, {
            permissionOverwrites: [
                { id: message.guild.id, deny: ['VIEW_CHANNEL'] },
                { id: message.author.id, allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'] }
            ]
        });

        db.createTicket(message.author.id, ticketChannel.id, message.guild.id);

        const embed = new MessageEmbed()
            .setColor('#2ecc71')
            .setTitle('🎫 Тикет создан')
            .setDescription(`Причина: ${reason}`)
            .addFields(
                { name: 'Канал', value: ticketChannel.name, inline: true },
                { name: 'Создатель', value: message.author.tag, inline: true }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });

        const ticketEmbed = new MessageEmbed()
            .setColor('#3498db')
            .setTitle('🎫 Тикет поддержки')
            .setDescription(`**Причина:** ${reason}\n\nОпишите вашу проблему.`)
            .setFooter({ text: 'Нажмите 🔒 чтобы закрыть тикет' });

        let content = null;
        if (roleMentions) {
            content = roleMentions;
        }
        
        const msg = await ticketChannel.send({ content, embeds: [ticketEmbed] });
        await msg.react('🔒');

        const collector = msg.createReactionCollector((r, u) => r.emoji.name === '🔒' && !u.bot);

        collector.on('collect', async () => {
            db.deleteTicket(ticketChannel.id);
            ticketChannel.delete();
        });
    }
};