const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;
// Default color if config.embedColor is not available or invalid


module.exports = {
  data: new SlashCommandBuilder()
    .setName('urban')
    .setDescription('Look up a term in the Urban Dictionary')
    .addStringOption(option =>
      option.setName('term')
        .setDescription('The term to look up')
        .setRequired(true)),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
          content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
          ephemeral: true 
      });
  }
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    const term = interaction.options.getString('term');

    try {
      const response = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
      
      if (response.data.list.length === 0) {
        return interaction.reply(`No definitions found for "${term}".`);
      }

      const definition = response.data.list[0];

      const embed = new EmbedBuilder()
      .setColor('#0000FF') 
        .setTitle(`Urban Dictionary: ${term}`)
        .setURL(definition.permalink)
        .addFields(
          { name: 'Definition', value: truncate(definition.definition, 1024) },
          { name: 'Example', value: truncate(definition.example, 1024) },
          { name: 'Rating', value: `👍 ${definition.thumbs_up} | 👎 ${definition.thumbs_down}` }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching Urban Dictionary definition:', error);
      await interaction.reply('An error occurred while fetching the definition. Please try again later.');
    }
  },
};

function truncate(str, max) {
  return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}
