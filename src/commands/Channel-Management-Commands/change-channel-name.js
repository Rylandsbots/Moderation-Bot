const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: false,
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changechannelname')
    .setDescription('Change the name of a specified channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to rename')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('The new name for the channel')
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

    const channel = interaction.options.getChannel('channel');
    const newName = interaction.options.getString('newname');
    const oldName = channel.name;

    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
    }

    try {
      await channel.setName(newName);
      await interaction.reply(`Channel ${channel} has been renamed from "${oldName}" to "${newName}".`);

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Channel Name Change Logs")
          .setDescription(`${interaction.user} renamed a channel:`)
          .addFields(
            { name: 'Old Name', value: oldName, inline: true },
            { name: 'New Name', value: newName, inline: true },
            { name: 'Channel', value: `${channel}`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error changing channel name:', error);
      await interaction.reply({ content: 'There was an error while changing the channel name.', ephemeral: true });
    }
  },
};
