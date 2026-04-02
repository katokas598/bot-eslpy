const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'levelroles',
    description: 'Показать роли за уровни',
    async execute(message, args, client, db) {
        const levelRoles = config.features.levels?.roles || [];
        
        if (levelRoles.length === 0) {
            return message.reply('❌ Роли за уровни не настроены');
        }
        
        let description = '';
        
        for (const roleData of levelRoles) {
            const role = roleData.roleId ? message.guild.roles.cache.get(roleData.roleId) : null;
            const roleName = role ? role.name : 'Роль не назначена';
            const rewardXp = roleData.rewardXp || 0;
            
            description += `⬆️ **Уровень ${roleData.level}**\n`;
            description += `   Роль: ${roleName}\n`;
            if (rewardXp > 0) {
                description += `   Награда: +${rewardXp} XP\n`;
            }
            description += '\n';
        }
        
        const embed = new MessageEmbed()
            .setColor('#9b59b6')
            .setTitle('⬆️ Роли за уровни')
            .setDescription(description)
            .setFooter({ text: 'Получи роль, достигнув нужного уровня!' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};