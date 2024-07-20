const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice with a specified number of sides')
    .addIntegerOption(option =>
      option.setName('sides')
        .setDescription('Number of sides on the dice (default is 6)')
        .setMinValue(2)
        .setMaxValue(1000000)
        .setRequired(false)),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const sides = interaction.options.getInteger('sides') || 6;
    const result = Math.floor(Math.random() * sides) + 1;

    const embed = new EmbedBuilder()
      .setColor('#0000FF')
      .setTitle('🎲 Dice Roll')
      .setDescription(`You rolled a ${result} on a ${sides}-sided dice!`)
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
