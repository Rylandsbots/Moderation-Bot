const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iss')
    .setDescription('Get information about the International Space Station'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    try {
      const response = await axios.get('http://api.open-notify.org/iss-now.json');
      const { latitude, longitude } = response.data.iss_position;
      const botAvatarURL = interaction.client.user.displayAvatarURL();

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('International Space Station Tracker')
        .setDescription(`Current location of the ISS:`)
        .addFields(
          { name: 'Latitude', value: latitude, inline: true },
          { name: 'Longitude', value: longitude, inline: true }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('ISS Website')
            .setStyle(ButtonStyle.Link)
            .setURL('https://www.nasa.gov/mission_pages/station/main/index.html'),
          new ButtonBuilder()
            .setLabel('ISS Live Stream')
            .setStyle(ButtonStyle.Link)
            .setURL('https://eol.jsc.nasa.gov/ESRS/HDEV/'),
          new ButtonBuilder()
            .setLabel('ISS FAQ')
            .setStyle(ButtonStyle.Link)
            .setURL('https://www.nasa.gov/international-space-station-frequently-asked-questions/')
        );

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error fetching ISS data:', error);
      await interaction.reply('Sorry, there was an error fetching ISS data. Please try again later.');
    }
  },
};
