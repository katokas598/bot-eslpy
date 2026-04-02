const axios = require('axios');

const langCodes = {
    'ru': 'Russian', 'en': 'English', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'uk': 'Ukrainian',
    'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic'
};

module.exports = {
    name: 'translate',
    description: 'Перевести текст',
    usage: '<язык> <текст>',
    async execute(message, args, client, db) {
        const lang = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ');
        
        if (!lang || !text) return message.reply('❌ Используйте: !translate <язык> <текст>');
        
        if (!langCodes[lang]) {
            return message.reply(`❌ Неизвестный язык. Доступные: ${Object.keys(langCodes).join(', ')}`);
        }

        try {
            const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${lang}|en`);
            const translated = response.data.responseData.translatedText;
            
            message.reply(`🌐 **Перевод (${langCodes[lang]}):** ${translated}`);
        } catch (e) {
            message.reply('❌ Ошибка перевода');
        }
    }
};