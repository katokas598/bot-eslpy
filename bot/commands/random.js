const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'random',
    description: 'Случайное число',
    usage: '<макс> [мин]',
    async execute(message, args, client, db) {
        const max = parseInt(args[0]) || 100;
        const min = parseInt(args[1]) || 1;
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const embed = new MessageEmbed()
            .setColor('#9b59b6')
            .setTitle('🎲 Случайное число')
            .setDescription(`Выпало число: **${num}**`);
        
        message.reply({ embeds: [embed] });
    }
};