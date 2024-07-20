const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;


module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display your own or another user\'s avatar')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose avatar you want to see (optional)')
        .setRequired(false)),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }
    
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    const user = interaction.options.getUser('user') || interaction.user;
    
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setColor('Random')
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};