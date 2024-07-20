const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Share a random inspirational quote'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    try {
      const response = await axios.get('https://zenquotes.io/api/random');
      const quoteData = response.data[0];

      const embed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('Inspirational Quote')
        .setDescription(`"${quoteData.q}"`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching quote:', error);
      await interaction.reply('Oops! I couldn\'t fetch a quote right now. Please try again later.');
    }
  },
};
