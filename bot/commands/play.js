const { MessageEmbed } = require('discord.js');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

const queue = new Map();

module.exports = {
    name: 'play',
    description: 'Воспроизвести музыку',
    usage: '<ссылка или поиск>',
    async execute(message, args, client, db) {
        if (!args[0]) return message.reply('❌ Укажите ссылку или название трека!');

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Вы должны быть в голосовом канале!');

        const query = args.join(' ');
        let trackUrl = query;
        let trackTitle = query;

        if (!query.startsWith('http')) {
            trackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }

        const serverQueue = queue.get(message.guild.id) || { songs: [], connection: null, player: null };
        
        serverQueue.songs.push({
            url: trackUrl,
            title: trackTitle,
            requestedBy: message.author.tag
        });

        if (!serverQueue.connection) {
            serverQueue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });

            serverQueue.player = createAudioPlayer();
            serverQueue.connection.subscribe(serverQueue.player);

            const playSong = async (song) => {
                try {
                    if (song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
                        const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' });
                        const resource = createAudioResource(stream);
                        serverQueue.player.play(resource);
                        
                        const embed = new MessageEmbed()
                            .setColor('#3498db')
                            .setTitle('🎵 Сейчас играет')
                            .setDescription(song.title)
                            .setFooter({ text: `Заказал: ${song.requestedBy}` });
                        
                        message.channel.send({ embeds: [embed] });
                    }
                } catch (e) {
                    console.error('Error playing:', e);
                    message.channel.send('❌ Ошибка при воспроизведении');
                }
            };

            serverQueue.player.on('idle', () => {
                serverQueue.songs.shift();
                if (serverQueue.songs.length > 0) playSong(serverQueue.songs[0]);
                else queue.delete(message.guild.id);
            });

            playSong(serverQueue.songs[0]);
            queue.set(message.guild.id, serverQueue);
        } else {
            const embed = new MessageEmbed()
                .setColor('#3498db')
                .setTitle('🎵 Добавлено в очередь')
                .setDescription(trackTitle);
            message.reply({ embeds: [embed] });
        }
    }
};