module.exports = {
    name: 'calc',
    description: 'Калькулятор',
    usage: '<выражение>',
    async execute(message, args, client, db) {
        const expr = args.join(' ');
        if (!expr) return message.reply('❌ Укажите выражение!');
        
        try {
            const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
            const result = Function('"use strict"; return (' + sanitized + ')')();
            
            message.reply(`📱 Результат: **${result}**`);
        } catch (e) {
            message.reply('❌ Неверное выражение!');
        }
    }
};