const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'stop',
    description: 'Остановить музыку',
    async execute(message, args, client, db) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Вы должны быть в голосовом канале!');
        
        const { getVoiceConnection } = require('@discordjs/voice');
        const connection = getVoiceConnection(message.guild.id);
        
        if (connection) {
            connection.destroy();
            message.reply('🛑 Музыка остановлена');
        } else {
            message.reply('❌ Я не в голосовом канале');
        }
    }
};