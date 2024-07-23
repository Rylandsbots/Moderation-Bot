const { EmbedBuilder, AuditLogEvent, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../settings.js');
const fs = require('fs');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

const dbTicketPanels = path.join(__dirname, '..', 'databases', 'ticketpanels.json');

module.exports = {
  name: 'ready',
  once: true,
  execute: async function(client) {
    console.log(`Logged in as ${client.user.tag}!`);

    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;

      // Load ticket panels from the database
      let ticketPanels = [];
      if (fs.existsSync(dbTicketPanels)) {
        const data = fs.readFileSync(dbTicketPanels, 'utf8');
        ticketPanels = JSON.parse(data);
      }

      // Find the ticket panel that matches the button's custom ID
      const ticketPanel = ticketPanels.find(panel => panel.buttonCustomId === interaction.customId);

      if (ticketPanel) {
        // Create a new channel for the ticket
        const channelName = `${interaction.user.username}-ticket`;
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: ticketPanel.managerRoleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
            },
          ],
        });

        // Create close button
        const closeButton = new ButtonBuilder()
          .setCustomId(`closeTicket_${interaction.user.id}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        // Send a message in the new ticket channel
        const ticketEmbed = new EmbedBuilder()
          .setTitle('New Ticket')
          .setDescription(`Ticket opened by ${interaction.user.toString()}`)
          .setColor('#00ff00')
          .setTimestamp();

        await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });

        // Reply to the user
        await interaction.reply({ content: `Ticket created! Please check ${ticketChannel.toString()}`, ephemeral: true });
      } else if (interaction.customId.startsWith('closeTicket_')) {
        // Handle closing the ticket
        const channel = interaction.channel;
        const ticketOpenerId = interaction.customId.split('_')[1];
        const ticketOpener = await client.users.fetch(ticketOpenerId);

        // Generate transcript
        const transcript = await discordTranscripts.createTranscript(channel);

        // Send transcript to the user who opened the ticket
        try {
          await ticketOpener.send({
            content: 'Here is a transcript of your closed ticket:',
            files: [transcript],
          });
        } catch (error) {
          console.error(`Failed to send transcript to user: ${error}`);
          await interaction.reply({ content: 'Failed to send transcript to the user. The ticket will still be closed.', ephemeral: true });
        }

        // Delete the channel
        await channel.delete();

        // Confirm to the user who closed the ticket
        await interaction.reply({ content: 'Ticket closed and transcript sent to the user who opened the ticket.', ephemeral: true });
      }
    });
  },
};
