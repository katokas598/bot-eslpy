const { Client, Collection, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');
const path = require('path');
const fs = require('fs');

async function startBot() {
    await db.initDB();
    console.log('[Database] База данных инициализирована');

    const client = new Client({
        intents: 513
    });

    client.commands = new Collection();
    client.prefix = config.discord.prefix;

    const loadCommands = () => {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.name, command);
        }
        console.log(`[Commands] Загружено ${commandFiles.length} команд`);
    };

    const loadEvents = () => {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            client.on(event.name, (...args) => event.execute(...args, client, db));
        }
        console.log(`[Events] Загружено ${eventFiles.length} событий`);
    };

    client.once('ready', () => {
        console.log(`[Bot] ${client.user.tag} готов к работе!`);
        console.log(`[Bot] На серверах: ${client.guilds.cache.size}`);
        
        client.user.setActivity({
            type: 'WATCHING',
            name: `${config.discord.prefix}help | ${client.guilds.cache.size} серверов`
        });
    });

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        const settings = db.getGuildSettings(message.guild.id);
        client.prefix = settings.prefix || config.discord.prefix;
        
        if (!message.content.startsWith(client.prefix)) {
            if (message.content.startsWith(`<@${client.user.id}>`)) {
                const helpEmbed = new MessageEmbed()
                    .setColor('#3498db')
                    .setTitle('📚 Мои команды')
                    .setDescription(`Используйте \`${client.prefix}help\` для списка команд`)
                    .setTimestamp();
                message.reply({ embeds: [helpEmbed] });
            }
            return;
        }
        
        const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName);
        if (command) {
            try {
                await command.execute(message, args, client, db);
            } catch (error) {
                console.error(`[Error] Ошибка в команде ${commandName}:`, error);
                const errorEmbed = new MessageEmbed()
                    .setColor('#e74c3c')
                    .setTitle('❌ Ошибка')
                    .setDescription('Произошла ошибка при выполнении команды')
                    .setTimestamp();
                message.reply({ embeds: [errorEmbed] });
            }
        }
    });

    client.on('guildMemberAdd', async (member) => {
        const settings = db.getGuildSettings(member.guild.id);
        if (settings.welcome_channel) {
            const channel = member.guild.channels.cache.get(settings.welcome_channel);
            if (channel) {
                const welcomeMsg = settings.welcome_message 
                    ? settings.welcome_message.replace('{user}', member.user.username).replace('{server}', member.guild.name)
                    : `Добро пожаловать на ${member.guild.name}, ${member.user}!`;
                
                const embed = new MessageEmbed()
                    .setColor('#2ecc71')
                    .setTitle('👋 Новый участник!')
                    .setDescription(welcomeMsg)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                
                channel.send({ embeds: [embed] });
            }
        }
    });

    client.on('guildMemberRemove', async (member) => {
        const settings = db.getGuildSettings(member.guild.id);
        if (settings.log_channel) {
            const channel = member.guild.channels.cache.get(settings.log_channel);
            if (channel) {
                const embed = new MessageEmbed()
                    .setColor('#e74c3c')
                    .setTitle('🚪 Участник вышел')
                    .setDescription(`**${member.user.tag}** покинул сервер`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                
                channel.send({ embeds: [embed] });
            }
        }
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.channelId && !newState.channelId) {
            if (oldState.serverMute === false) {
                const settings = db.getLevelSettings();
                const xpPerMinute = settings?.xp_per_voice_minute || 2;
                db.addVoiceTime(oldState.id, xpPerMinute);
            }
        }
    });

    loadCommands();
    loadEvents();

    client.login(config.discord.token);

    return client;
}

startBot().catch(console.error);

module.exports = null;