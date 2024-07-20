const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('randomfact')
    .setDescription('Share a random interesting fact'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    try {
      const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
      const factData = response.data;

      const embed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('🤔 Random Fact')
        .setDescription(factData.text)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error('Error fetching random fact:', error);
      await interaction.reply({ content: 'Oops! I couldn\'t fetch a random fact right now. Please try again later.', ephemeral: true });
    }
  },
};
