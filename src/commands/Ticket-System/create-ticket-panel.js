const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../settings.js');
const rolePermissions = {
  moderators: true,
  founders: false
};
const dbTicketPanels = path.join(__dirname, '..', '..', 'databases', 'ticketpanels.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createticketpanel')
    .setDescription('Create a ticket panel with a button to open tickets')
    .addRoleOption(option =>
      option.setName('manager_role')
        .setDescription('The role that can manage tickets')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('ticket_category')
        .setDescription('The category where tickets should be opened')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );
    const managerRole = interaction.options.getRole('manager_role');
    const ticketCategory = interaction.options.getChannel('ticket_category');

    // Generate random custom IDs
    const modalCustomId = `ticketPanelModal_${uuidv4()}`;
    const buttonCustomId = `openTicket_${uuidv4()}`;

    // Create a modal for embed input
    const modal = new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle('Ticket Panel Embed');

    // Add input fields for embed title, description, and ticket open message
    const titleInput = new TextInputBuilder()
      .setCustomId('embedTitle')
      .setLabel('Embed Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the title for the ticket panel embed')
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embedDescription')
      .setLabel('Embed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter the description for the ticket panel embed')
      .setRequired(true);

    const ticketOpenMessageInput = new TextInputBuilder()
      .setCustomId('ticketOpenMessage')
      .setLabel('Ticket Open Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter the message to be sent when a ticket is opened')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(ticketOpenMessageInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);

    // Wait for the modal to be submitted
    const filter = (interaction) => interaction.customId === modalCustomId;
    try {
      const modalSubmission = await interaction.awaitModalSubmit({ filter, time: 60000 });

      const embedTitle = modalSubmission.fields.getTextInputValue('embedTitle');
      const embedDescription = modalSubmission.fields.getTextInputValue('embedDescription');
      const ticketOpenMessage = modalSubmission.fields.getTextInputValue('ticketOpenMessage');

      const botAvatarURL = interaction.client.user.displayAvatarURL();

      // Create the embed
      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(embedDescription)
        .setColor('#0099ff')
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `Created Panel By: ${interaction.user.tag}`, iconURL: botAvatarURL });

      // Create the button
      const button = new ButtonBuilder()
        .setCustomId(buttonCustomId)
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      // Send the embed with the button
      const message = await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      // Create ticket panel data
      const ticketPanelData = {
        id: uuidv4(),
        messageId: message.id,
        channelId: message.channel.id,
        guildId: interaction.guild.id,
        managerRoleId: managerRole.id,
        ticketCategoryId: ticketCategory.id,
        embedTitle: embedTitle,
        embedDescription: embedDescription,
        buttonCustomId: buttonCustomId,
        ticketOpenMessage: ticketOpenMessage
      };

      // Save to database
      let ticketPanels = [];
      if (fs.existsSync(dbTicketPanels)) {
        const data = fs.readFileSync(dbTicketPanels, 'utf8');
        ticketPanels = JSON.parse(data);
      }

      ticketPanels.push(ticketPanelData);
      fs.writeFileSync(dbTicketPanels, JSON.stringify(ticketPanels, null, 2));

      await modalSubmission.reply({ content: 'Ticket panel created successfully!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.followUp({ content: 'Failed to create the ticket panel. Please try again.', ephemeral: true });
    }
  },
};
