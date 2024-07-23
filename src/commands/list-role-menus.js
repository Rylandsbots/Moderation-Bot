const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const dbRoleMenu = path.join(__dirname, '..', '..', 'databases', 'rolemenus.json');
const rolePermissions = {
  moderators: true,
  founders: false
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('listrolemenus')
    .setDescription('List all role menus and their data'),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );
    await interaction.deferReply({ ephemeral: true });

    // Read role menus from database
    let rolemenus = [];
    if (fs.existsSync(dbRoleMenu)) {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
    }

    if (rolemenus.length === 0) {
      return interaction.editReply('There are no role menus created yet.');
    }

    const embeds = [];
 const botAvatarURL = interaction.client.user.displayAvatarURL();
    let currentEmbed = new EmbedBuilder()
      .setTitle('Role Menus')
      .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })

    for (const menu of rolemenus) {
      const fieldContent = menu.roles.map(role => `${role.emoji} - ${role.name}`).join('\n');
      const field = { name: `${menu.groupName} (ID: ${menu.id})`, value: fieldContent };

      if (currentEmbed.data.fields && currentEmbed.data.fields.length >= 25) {
        embeds.push(currentEmbed);
        currentEmbed = new EmbedBuilder()
          .setTitle('Role Menus (Continued)')
          .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      }

      currentEmbed.addFields(field);
    }

    embeds.push(currentEmbed);

    await interaction.editReply({ content: 'Here are the role menus:', ephemeral: true });

    for (const embed of embeds) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};
