const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const dbRoleMenu = path.join(__dirname, '..', '..', 'databases', 'rolemenus.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loadrolemenu')
    .setDescription('Load a role menu by UUID')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the role menu to load')
        .setRequired(true)),

  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemenumanagement.loadrolemenu.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.deferReply();

    const uuid = interaction.options.getString('uuid');

    // Read role menus from database
    let rolemenus = [];
    if (fs.existsSync(dbRoleMenu)) {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
    }

    const roleMenu = rolemenus.find(menu => menu.id === uuid);

    if (!roleMenu) {
      return interaction.editReply('No role menu found with the provided UUID.');
    }
 const botAvatarURL = interaction.client.user.displayAvatarURL();
    const embed = new EmbedBuilder()
      .setTitle(roleMenu.embedTitle || `Role Menu: ${roleMenu.groupName}`)
      .setDescription(roleMenu.embedDescription || 'React to get the corresponding role:')
      .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
          .setFooter({ text: `Loaded BY: ${interaction.user.tag}`, iconURL: botAvatarURL })
 .addFields(
    {
      name: "Add And Remove Roles From Your Self",
      value: "Click on the reactions to add and remove roles from your self.",
      inline: false
    },
  )
    roleMenu.roles.forEach(role => {
      embed.addFields({ name: role.name, value: `${role.emoji}`, inline: true });
    });

    const message = await interaction.editReply({ embeds: [embed] });

    // Add reactions to the message
    for (const role of roleMenu.roles) {
      await message.react(role.emoji);
    }

    // Update the message ID in the database
    roleMenu.messageId = message.id;
    fs.writeFileSync(dbRoleMenu, JSON.stringify(rolemenus, null, 2));

    await interaction.followUp({ content: 'Role menu loaded successfully!', ephemeral: true });
  },
};
