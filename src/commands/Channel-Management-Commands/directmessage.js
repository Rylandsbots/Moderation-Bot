const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to send the message to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
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

    const targetUser = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    try {
      await targetUser.send(message);
      await targetUser.send("Note: This bot cannot see any messages sent back to it.");
      
      await interaction.reply({ content: `Message sent successfully to ${targetUser.tag}. They have been informed that the bot cannot see any replies.`, ephemeral: true });

      // Create and send the embed to a specific channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Direct Message Logs")
          .setDescription(`${interaction.user} sent a direct message:`)
          .addFields(
            { name: 'Recipient', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: 'Sender', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Message Content', value: message }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error sending DM:', error);
      await interaction.reply({ content: `Failed to send a message to ${targetUser.tag}. They may have DMs disabled or have blocked the bot.`, ephemeral: true });
    }
  },
};
