const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const rolePermissions = {
  moderators: true,
  founders: false
};
const dbTicketPanels = path.join(__dirname, '..', '..', 'databases', 'ticketpanels.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loadticketpanel')
    .setDescription('Load an existing ticket panel')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the ticket panel to load')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to load the ticket panel in (default: current channel)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );
    const uuid = interaction.options.getString('uuid');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Read the ticket panels from the database
    let ticketPanels = [];
    if (fs.existsSync(dbTicketPanels)) {
      const data = fs.readFileSync(dbTicketPanels, 'utf8');
      ticketPanels = JSON.parse(data);
    }

    // Find the ticket panel by UUID
    const panel = ticketPanels.find(panel => panel.id === uuid);
    if (!panel) {
      return interaction.reply({ content: 'Ticket panel not found.', ephemeral: true });
    }

    // Check if the user has the manager role
    const managerRole = interaction.guild.roles.cache.get(panel.managerRoleId);
    if (!managerRole || !interaction.member.roles.cache.has(managerRole.id)) {
      return interaction.reply({ content: 'You do not have permission to load this ticket panel.', ephemeral: true });
    }

    try {
      // Create the embed
 const botAvatarURL = interaction.client.user.displayAvatarURL();
      const embed = new EmbedBuilder()
        .setTitle(panel.embedTitle)
        .setDescription(panel.embedDescription)
        .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
          .setFooter({ text: `Loaded by ${interaction.user.tag}`, iconURL: botAvatarURL });

      // Create the button
      const button = new ButtonBuilder()
        .setCustomId(panel.buttonCustomId)
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      // Send the embed with the button
      const message = await channel.send({
        embeds: [embed],
        components: [row]
      });

      // Update the panel data with new message and channel IDs
      panel.messageId = message.id;
      panel.channelId = channel.id;

      // Save the updated panel data
      fs.writeFileSync(dbTicketPanels, JSON.stringify(ticketPanels, null, 2));

      await interaction.reply({ content: `Ticket panel loaded successfully in ${channel}.`, ephemeral: true });
    } catch (error) {
      console.error('Error loading ticket panel:', error);
      await interaction.reply({ content: 'An error occurred while loading the ticket panel.', ephemeral: true });
    }
  },
};
