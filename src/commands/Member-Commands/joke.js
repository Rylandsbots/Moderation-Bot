const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tell a random joke'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    try {
      const response = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
      const jokeData = response.data;

      let jokeText;
      if (jokeData.type === 'single') {
        jokeText = jokeData.joke;
      } else {
        jokeText = `${jokeData.setup}\n\n${jokeData.delivery}`;
      }

      const embed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle('Here\'s a joke for you!')
        .setDescription(jokeText)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching joke:', error);
      await interaction.reply('Oops! I couldn\'t think of a joke right now. Try again later!');
    }
  },
};
