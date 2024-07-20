const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('movevc')
    .setDescription('Move a user to another voice channel')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to move (mention or ID)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The voice channel to move the user to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for moving the user')
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

    const userToMove = interaction.options.getMember('user');
    const targetChannel = interaction.options.getChannel('channel');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!userToMove) {
      return interaction.reply({ content: 'Invalid user or user not found in the server.', ephemeral: true });
    }

    if (!targetChannel || targetChannel.type !== 2) { // 2 is the channel type for voice channels
      return interaction.reply({ content: 'Please select a valid voice channel.', ephemeral: true });
    }

    if (!userToMove.voice.channel) {
      return interaction.reply({ content: 'The specified user is not in a voice channel.', ephemeral: true });
    }

    const oldChannel = userToMove.voice.channel;

    try {
      await userToMove.voice.setChannel(targetChannel);

      const moveEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`You Have Been Moved in ${interaction.guild.name}`)
        .setDescription(`You have been moved from ${oldChannel} to ${targetChannel}`)
        .addFields({ name: 'Reason', value: reason })
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      try {
        await userToMove.send({ embeds: [moveEmbed] });
      } catch (error) {
        console.error(`Failed to send move message to ${userToMove.user.tag}: ${error}`);
      }

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle("User Voice Channel Move Logs")
          .setDescription(`${interaction.user} moved a user:`)
          .addFields(
            { name: 'Moved User', value: `${userToMove.user.tag} (${userToMove.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'From Channel', value: oldChannel.name, inline: true },
            { name: 'To Channel', value: targetChannel.name, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error(`Failed to find the log channel with ID ${config.botlogs}`);
      }

      return interaction.reply({ content: `Successfully moved ${userToMove.user.tag} from ${oldChannel.name} to ${targetChannel.name}.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error trying to move the user.', ephemeral: true });
    }
  },
};
