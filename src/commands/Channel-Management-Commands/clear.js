const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear messages from the current channel')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to clear (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
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

    const amount = interaction.options.getInteger('amount');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(messages, true);

      await interaction.reply({ content: `Successfully cleared ${messages.size} messages.`, ephemeral: true });

      // Create and send the embed to a specific channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Message Clear Logs")
          .setDescription(`${interaction.user} cleared messages:`)
          .addFields(
            { name: 'Channel', value: `${interaction.channel}`, inline: true },
            { name: 'Messages Cleared', value: `${messages.size}`, inline: true },
            { name: 'Moderator', value: `${interaction.user}`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error clearing messages:', error);
      return interaction.reply({ content: 'There was an error trying to clear messages in this channel!', ephemeral: true });
    }
  },
};
