const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletechannel')
    .setDescription('Delete a specified channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to delete')
        .setRequired(true)
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

    const channelToDelete = interaction.options.getChannel('channel');

    // Check if the bot has permission to delete the channel
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: 'I do not have permission to delete channels.', ephemeral: true });
    }

    try {
      const channelName = channelToDelete.name;
      const channelId = channelToDelete.id;
      const channelType = channelToDelete.type;

      await channelToDelete.delete();
      await interaction.reply(`Channel "${channelName}" has been deleted.`);

      // Create and send the embed to a specific channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')  // Red color for deletion
          .setTitle("Channel Deletion Logs")
          .setDescription(`${interaction.user} deleted a channel:`)
          .addFields(
            { name: 'Channel Name', value: channelName, inline: true },
            { name: 'Channel ID', value: channelId, inline: true },
            { name: 'Channel Type', value: channelType.toString(), inline: true },
            { name: 'Deleted By', value: `${interaction.user}`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error deleting channel:', error);
      await interaction.reply({ content: 'There was an error while deleting the channel.', ephemeral: true });
    }
  },
};
