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


    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;

      let ticketPanels = [];
      if (fs.existsSync(dbTicketPanels)) {
        const data = fs.readFileSync(dbTicketPanels, 'utf8');
        ticketPanels = JSON.parse(data);
      }

 

      const ticketPanel = ticketPanels.find(panel => panel.buttonCustomId === interaction.customId);

      if (ticketPanel) {
        const channelName = `${interaction.user.username}-ticket`;
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: ticketPanel.ticketCategoryId,
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

        const closeButton = new ButtonBuilder()
          .setCustomId(`closeTicket_${interaction.user.id}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const ticketEmbed = new EmbedBuilder()
          .setTitle(ticketPanel.embedTitle)
          .setDescription(ticketPanel.ticketOpenMessage.replace('{user}', interaction.user.toString()))
          .setColor('#00ff00')
          .setTimestamp();

        await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: `Ticket created! Please check ${ticketChannel.toString()}`, ephemeral: true });

      } else if (interaction.customId.startsWith('closeTicket_')) {
        const channel = interaction.channel;
        const ticketOpenerId = interaction.customId.split('_')[1];
        const ticketOpener = await client.users.fetch(ticketOpenerId);
        const transcript = await discordTranscripts.createTranscript(channel);

        // Read the ticketPanels data again here
        let ticketPanels = [];
        if (fs.existsSync(dbTicketPanels)) {
          const data = fs.readFileSync(dbTicketPanels, 'utf8');
          ticketPanels = JSON.parse(data);
        }

      

        const ticketPanel = ticketPanels.find(panel => panel.ticketCategoryId === channel.parentId);



        if (ticketPanel && ticketPanel.transcriptChannelId) {
  

          try {
            const transcriptChannel = await client.channels.fetch(ticketPanel.transcriptChannelId);
            await transcriptChannel.send({
              content: `Transcript for ticket ${channel.name}:`,
              files: [transcript],
            });
          } catch (error) {
            console.error(`Error sending transcript to channel ID ${ticketPanel.transcriptChannelId}: ${error}`);
          }
        } else {
          console.log('No valid transcriptChannelId found');
        }

        try {
          await ticketOpener.send({
            content: 'Here is a transcript of your closed ticket:',
            files: [transcript],
          });
        } catch (error) {
          console.error(`Failed to send transcript to user: ${error}`);
          await interaction.reply({ content: 'Failed to send transcript to the user. The ticket will still be closed.', ephemeral: true });
        }

        await channel.delete();
        await interaction.reply({ content: 'Ticket closed and transcript sent to the transcript channel.', ephemeral: true });
      }
    });
  },
};
