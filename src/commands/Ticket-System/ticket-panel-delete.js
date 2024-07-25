const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const dbTicketPanels = path.join(__dirname, '..', '..', 'databases', 'ticketpanels.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteticketpanel')
    .setDescription('Delete a ticket panel')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the ticket panel to delete')
        .setRequired(true)),

  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.ticketmenumanagement.deleteticketpanel.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
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
