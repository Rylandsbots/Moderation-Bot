const { SlashCommandBuilder } = require('discord.js');
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
    .setName('deleterolemenu')
    .setDescription('Delete an existing role menu')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the role menu to delete')
        .setRequired(true)),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );

    if (!hasPermission) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    // Read the existing role menus
    let rolemenus = [];
    if (fs.existsSync(dbRoleMenu)) {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
    }

    const uuid = interaction.options.getString('uuid');
    const menuIndex = rolemenus.findIndex(menu => menu.id === uuid);

    if (menuIndex === -1) {
      return interaction.editReply('No role menu found with the provided UUID.');
    }

    const menuToDelete = rolemenus[menuIndex];

    // Try to delete the message associated with the role menu
    try {
      const channel = await interaction.client.channels.fetch(interaction.channelId);
      const message = await channel.messages.fetch(menuToDelete.messageId);
      await message.delete();
    } catch (error) {
      console.error('Error deleting message:', error);
      await interaction.followUp({ content: 'The role menu message could not be found or deleted. It may have been manually deleted earlier.', ephemeral: true });
    }

    // Remove the role menu from the array
    rolemenus.splice(menuIndex, 1);

    // Save the updated role menus
    fs.writeFileSync(dbRoleMenu, JSON.stringify(rolemenus, null, 2));

    await interaction.editReply(`Role menu with UUID ${uuid} has been deleted successfully.`);
  },
};
