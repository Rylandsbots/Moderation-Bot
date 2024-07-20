const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say a message in a specified channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the message in')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to say')
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
    const message = interaction.options.getString('message');

    // Check if the channel is a text channel
    if (!channel.isTextBased()) {
      return interaction.reply({ content: 'The specified channel must be a text channel.', ephemeral: true });
    }

    // Check if the bot has permission to send messages in the channel
    if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: 'I do not have permission to send messages in that channel.', ephemeral: true });
    }

    try {
      await channel.send(message);
      await interaction.reply({ content: `Message sent successfully in ${channel}.`, ephemeral: true });

      // Create and send the embed to a specific channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Say Command Logs")
          .setDescription(`${interaction.user} used the say command:`)
          .addFields(
            { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
            { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Message Content', value: message }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      await interaction.reply({ content: 'Failed to send the message. Please try again.', ephemeral: true });
    }
  },
};
