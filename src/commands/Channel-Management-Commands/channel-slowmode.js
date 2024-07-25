const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set or remove slowmode for a channel')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Slowmode duration')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: '0' },
          { name: '5 seconds', value: '5' },
          { name: '10 seconds', value: '10' },
          { name: '15 seconds', value: '15' },
          { name: '30 seconds', value: '30' },
          { name: '1 minute', value: '60' },
          { name: '2 minutes', value: '120' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '15 minutes', value: '900' },
          { name: '30 minutes', value: '1800' },
          { name: '1 hour', value: '3600' },
          { name: '2 hours', value: '7200' },
          { name: '6 hours', value: '21600' }
        )
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to set slowmode for (default: current channel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.commandmanagement.slowmode.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const seconds = parseInt(interaction.options.getString('duration'));
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'Slowmode can only be set for text channels.', ephemeral: true });
    }

    try {
      await channel.setRateLimitPerUser(seconds);
      
      let replyMessage;
      if (seconds === 0) {
        replyMessage = `Slowmode has been disabled in ${channel}.`;
      } else {
        const duration = interaction.options.getString('duration');
        replyMessage = `Slowmode has been set to ${duration} in ${channel}.`;
      }

      await interaction.reply(replyMessage);

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Slowmode Change Logs")
          .setDescription(`${interaction.user} changed slowmode settings:`)
          .addFields(
            { name: 'Channel', value: `${channel}`, inline: true },
            { name: 'New Slowmode', value: seconds === 0 ? 'Disabled' : `${seconds} seconds`, inline: true },
            { name: 'Moderator', value: `${interaction.user}`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error setting slowmode:', error);
      await interaction.reply({ content: 'There was an error while setting the slowmode.', ephemeral: true });
    }
  },
};
