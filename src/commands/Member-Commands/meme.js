const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Display a random wholesome meme'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    try {
      const response = await axios.get('https://meme-api.com/gimme/wholesomememes');
      const memeData = response.data;

      const embed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle(memeData.title)
        .setURL(memeData.postLink)
        .setImage(memeData.url)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching meme:', error);
      await interaction.reply('Oops! I couldn\'t fetch a wholesome meme right now. Please try again later.');
    }
  },
};
