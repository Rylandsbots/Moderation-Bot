const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('disconnect')
    .setDescription('Disconnect a user from their current voice channel')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to disconnect (mention or ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for disconnecting the user')
        .setRequired(false)
    ),

  async execute(interaction) {
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    // Check if the user has the required role

    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.disconnect.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userToDisconnect = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!userToDisconnect) {
      return interaction.reply({ content: 'Invalid user or user not found in the server.', ephemeral: true });
    }

    if (!userToDisconnect.voice.channel) {
      return interaction.reply({ content: 'The specified user is not in a voice channel.', ephemeral: true });
    }

    const oldChannel = userToDisconnect.voice.channel;

    try {
      await userToDisconnect.voice.disconnect();

      const disconnectEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`You Have Been Disconnected in ${interaction.guild.name}`)
        .setDescription(`You have been disconnected from ${oldChannel}`)
        .addFields({ name: 'Reason', value: reason })
        .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();
      try {
        await userToDisconnect.send({ embeds: [disconnectEmbed] });
      } catch (error) {
        console.error(`Failed to send disconnect message to ${userToDisconnect.user.tag}: ${error}`);
      }

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle("User Voice Channel Disconnect Logs")
          .setDescription(`${interaction.user} disconnected a user:`)
          .addFields(
            { name: 'Disconnected User', value: `${userToDisconnect.user.tag} (${userToDisconnect.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'From Channel', value: oldChannel.name, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error(`Failed to find the log channel with ID ${config.botlogs}`);
      }

      return interaction.reply({ content: `Successfully disconnected ${userToDisconnect.user.tag} from ${oldChannel.name}.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error trying to disconnect the user.', ephemeral: true });
    }
  },
};
