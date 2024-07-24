const { EmbedBuilder, AuditLogEvent, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
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
  const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });
        const ticketEmbed = new EmbedBuilder()
          .setTitle(ticketPanel.embedTitle)
          .setDescription(ticketPanel.ticketOpenMessage.replace('{user}', interaction.user.toString()))
          .setColor('#00ff00')
            .setThumbnail(botAvatarURL)
     		.setFooter({ text: client.user.username, iconURL: botAvatarURL })
        	.setTimestamp();

        await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: `Ticket created! Please check ${ticketChannel.toString()}`, ephemeral: true });

      } else if (interaction.customId.startsWith('closeTicket_')) {
        const channel = interaction.channel;
        const ticketOpenerId = interaction.customId.split('_')[1];
        const ticketOpener = await client.users.fetch(ticketOpenerId);

        const reopenButton = new ButtonBuilder()
          .setCustomId(`reopenTicket_${ticketOpenerId}`)
          .setLabel('Reopen Ticket')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(reopenButton);
  const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });
        const warningEmbed = new EmbedBuilder()
          .setTitle('Ticket Closing')
          .setDescription('This ticket will close in 30 seconds. To prevent closing, click the reopen button.')
          .setColor('#FFA500')
            .setThumbnail(botAvatarURL)
     		.setFooter({ text: client.user.username, iconURL: botAvatarURL })
        	.setTimestamp();

        const warningMessage = await channel.send({ embeds: [warningEmbed], components: [row] });

        const filter = i => i.customId === `reopenTicket_${ticketOpenerId}` && i.user.id === ticketOpenerId;
        const collector = channel.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
          await i.update({ content: 'Ticket reopened!', embeds: [], components: [] });
          collector.stop('reopened');
        });

        collector.on('end', async (collected, reason) => {
          if (reason === 'reopened') {
            return;
          }

          // Generate the transcript
          const transcript = await discordTranscripts.createTranscript(channel);

          // Create an attachment from the transcript
          const attachment = new AttachmentBuilder(transcript.attachment, { name: 'transcript.html' });

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
              
              // Send the attachment to the transcript channel
              const transcriptMessage = await transcriptChannel.send({ files: [attachment] });
              const transcriptUrl = transcriptMessage.attachments.first().url;
  	
              // Create the embed for the transcript channel
              const transcriptChannelEmbed = new EmbedBuilder()
                .setTitle(`Transcript for ticket ${channel.name}`)
                .setDescription(`Ticket closed by ${interaction.user.tag}`)
                .setColor('#00ff00')
               .setThumbnail(botAvatarURL)
     		.setFooter({ text: client.user.username, iconURL: botAvatarURL })
        	.setTimestamp()
                .addFields(
                  { name: 'Ticket Opener', value: ticketOpener.tag, inline: true },
                  { name: 'Closed At', value: new Date().toUTCString(), inline: true },
                  { name: 'Server', value: interaction.guild.name, inline: true }
                );

              // Send the embed to the transcript channel
              await transcriptChannel.send({ embeds: [transcriptChannelEmbed] });

              // Create the embed for the user with the transcript link
              const userEmbed = new EmbedBuilder()
                .setTitle(`Ticket Transcript - ${channel.name}`)
                .setDescription("This is your transcript log from your ticket")
                .setColor('#00ff00')
           .setThumbnail(botAvatarURL)
     		.setFooter({ text: client.user.username, iconURL: botAvatarURL })
        	.setTimestamp()
                .addFields(
                  {
                    name: "Transcript Link:",
                    value: transcriptUrl,
                    inline: false
                  },
                  {
                    name: "How To View Your Transcript.",
                    value: "This is your transcript log from your ticket. To view your ticket information, click the link above, go to your downloads, and open the file.",
                    inline: false
                  },
                  {
                    name: "Ticket Details",
                    value: `Ticket Name: ${channel.name}\nClosed At: ${new Date().toUTCString()}\nCategory: ${channel.parent ? channel.parent.name : 'N/A'}`,
                    inline: false
                  },
                );

              // Send the embed with the link to the user
              await ticketOpener.send({ embeds: [userEmbed] });

              await channel.delete();
              await interaction.followUp({ content: 'Ticket closed and transcript sent.', ephemeral: true });

            } catch (error) {
              console.error(`Error sending transcript: ${error}`);
              await interaction.followUp({ content: 'Failed to send transcript. The ticket will still be closed.', ephemeral: true });
            }
          } else {
            console.log('No valid transcriptChannelId found');
          }
        });
      }
    });
  },
};
