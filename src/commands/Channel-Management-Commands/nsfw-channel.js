const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nsfw')
    .setDescription('Toggle NSFW status for a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to toggle NSFW status (default: current channel)')
        .setRequired(false)
    ),

  async execute(interaction) {
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    // Check if the user has the required role
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );

    if (!hasPermission) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Check if the channel is a valid guild text channel
    if (!channel.isTextBased() || channel.isDMBased()) {
      return interaction.reply({ content: 'NSFW status can only be set for server text channels.', ephemeral: true });
    }

    try {
      // Toggle the NSFW status
      const newNsfwStatus = !channel.nsfw;
      await channel.setNSFW(newNsfwStatus);

      const statusMessage = newNsfwStatus ? 'enabled' : 'disabled';
      await interaction.reply(`NSFW status has been ${statusMessage} for ${channel}.`);

      // Create and send the embed to a specific channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(newNsfwStatus ? '#FF0000' : '#00FF00')  // Red for enabled, Green for disabled
          .setTitle("NSFW Status Change Logs")
          .setDescription(`${interaction.user} changed NSFW status:`)
          .addFields(
            { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
            { name: 'New Status', value: newNsfwStatus ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Changed By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error toggling NSFW status:', error);
      await interaction.reply({ content: 'There was an error while toggling the NSFW status.', ephemeral: true });
    }
  },
};
