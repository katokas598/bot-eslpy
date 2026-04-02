const axios = require('axios');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'weather',
    description: 'Показать погоду',
    usage: '<город>',
    async execute(message, args, client, db) {
        const city = args.join(' ');
        if (!city) return message.reply('❌ Укажите город!');

        try {
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const data = response.data.current_condition[0];

            const embed = new MessageEmbed()
                .setColor('#3498db')
                .setTitle(`🌤️ Погода в ${city}`)
                .addFields(
                    { name: 'Температура', value: `${data.temp_C}°C`, inline: true },
                    { name: 'Ощущается как', value: `${data.feelsLikeC}°C`, inline: true },
                    { name: 'Влажность', value: `${data.humidity}%`, inline: true },
                    { name: 'Ветер', value: `${data.windspeedKmph} км/ч`, inline: true },
                    { name: 'Состояние', value: data.weatherDesc[0].value }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (e) {
            message.reply('❌ Не удалось получить погоду');
        }
    }
};