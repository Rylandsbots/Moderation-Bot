const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');

const dbTicketPanels = path.join(__dirname, '..', '..', 'databases', 'ticketpanels.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editticketpanel')
    .setDescription('Edit an existing ticket panel')
    .addStringOption(option =>
      option.setName('panel_id')
        .setDescription('The UUID of the ticket panel to edit')
        .setRequired(true)),

  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.ticketmenumanagement.editticketpanel.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const panelId = interaction.options.getString('panel_id');

    // Read ticket panels from the database
    let ticketPanels = [];
    if (fs.existsSync(dbTicketPanels)) {
      const data = fs.readFileSync(dbTicketPanels, 'utf8');
      ticketPanels = JSON.parse(data);
    }

    // Find the ticket panel with the given UUID
    const panelToEdit = ticketPanels.find(panel => panel.id === panelId);

    if (!panelToEdit) {
      return interaction.reply({ content: 'Ticket panel not found. Please check the UUID and try again.', ephemeral: true });
    }

    // Create a modal for editing the panel
    const modal = new ModalBuilder()
      .setCustomId(`editTicketPanel_${panelId}`)
      .setTitle('Edit Ticket Panel');

    // Add input fields for embed title, description, and ticket open message
    const titleInput = new TextInputBuilder()
      .setCustomId('embedTitle')
      .setLabel('Embed Title')
      .setStyle(TextInputStyle.Short)
      .setValue(panelToEdit.embedTitle)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embedDescription')
      .setLabel('Embed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(panelToEdit.embedDescription)
      .setRequired(true);

    const ticketOpenMessageInput = new TextInputBuilder()
      .setCustomId('ticketOpenMessage')
      .setLabel('Ticket Open Message')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(panelToEdit.ticketOpenMessage)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(ticketOpenMessageInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);

    // Wait for the modal to be submitted
    const filter = (interaction) => interaction.customId === `editTicketPanel_${panelId}`;
    try {
      const modalSubmission = await interaction.awaitModalSubmit({ filter, time: 60000 });

      const newEmbedTitle = modalSubmission.fields.getTextInputValue('embedTitle');
      const newEmbedDescription = modalSubmission.fields.getTextInputValue('embedDescription');
      const newTicketOpenMessage = modalSubmission.fields.getTextInputValue('ticketOpenMessage');

      // Update the panel data
      panelToEdit.embedTitle = newEmbedTitle;
      panelToEdit.embedDescription = newEmbedDescription;
      panelToEdit.ticketOpenMessage = newTicketOpenMessage;

      // Update the embed in the channel
      const channel = await interaction.client.channels.fetch(panelToEdit.channelId);
      const message = await channel.messages.fetch(panelToEdit.messageId);

      const updatedEmbed = new EmbedBuilder()
        .setTitle(newEmbedTitle)
        .setDescription(newEmbedDescription)
        .setColor('#0099ff')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: `Updated Panel By: ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() });

      const button = new ButtonBuilder()
        .setCustomId(panelToEdit.buttonCustomId)
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      await message.edit({
        embeds: [updatedEmbed],
        components: [row]
      });

      // Save the updated panel data to the database
      fs.writeFileSync(dbTicketPanels, JSON.stringify(ticketPanels, null, 2));

      await modalSubmission.reply({ content: 'Ticket panel updated successfully!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.followUp({ content: 'Failed to update the ticket panel. Please try again.', ephemeral: true });
    }
  },
};
