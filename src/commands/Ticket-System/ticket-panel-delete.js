const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const dbTicketPanels = path.join(__dirname, '..', '..', 'databases', 'ticketpanels.json');
const rolePermissions = {
  moderators: true,
  founders: false
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteticketpanel')
    .setDescription('Delete a ticket panel')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the ticket panel to delete')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );
    const uuid = interaction.options.getString('uuid');

    // Read the ticket panels from the database
    let ticketPanels = [];
    if (fs.existsSync(dbTicketPanels)) {
      const data = fs.readFileSync(dbTicketPanels, 'utf8');
      ticketPanels = JSON.parse(data);
    }

    // Find the ticket panel by UUID
    const panelIndex = ticketPanels.findIndex(panel => panel.id === uuid);
    if (panelIndex === -1) {
      return interaction.reply({ content: 'Ticket panel not found.', ephemeral: true });
    }

    const panel = ticketPanels[panelIndex];

    // Check if the user has the manager role
    const managerRole = interaction.guild.roles.cache.get(panel.managerRoleId);
    if (!managerRole || !interaction.member.roles.cache.has(managerRole.id)) {
      return interaction.reply({ content: 'You do not have permission to delete this ticket panel.', ephemeral: true });
    }

    try {
      // Delete the message containing the ticket panel
      const channel = await interaction.guild.channels.fetch(panel.channelId);
      const message = await channel.messages.fetch(panel.messageId);
      await message.delete();

      // Remove the panel from the database
      ticketPanels.splice(panelIndex, 1);
      fs.writeFileSync(dbTicketPanels, JSON.stringify(ticketPanels, null, 2));

      await interaction.reply({ content: 'Ticket panel deleted successfully.', ephemeral: true });
    } catch (error) {
      console.error('Error deleting ticket panel:', error);
      await interaction.reply({ content: 'An error occurred while deleting the ticket panel.', ephemeral: true });
    }
  },
};
