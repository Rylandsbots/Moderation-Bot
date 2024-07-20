const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicemute')
    .setDescription('Server mute or unmute a user in voice channels')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to mute/unmute (mention or ID)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('mute')
        .setDescription('True to mute, False to unmute')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the mute/unmute')
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

    const userInput = interaction.options.getUser('user');
    const muteAction = interaction.options.getBoolean('mute');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(userInput.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: 'Invalid user or user not found in the server.', ephemeral: true });
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot mute/unmute myself.', ephemeral: true });
    }

    if (!member.voice.channel) {
      return interaction.reply({ content: 'The specified member is not in a voice channel.', ephemeral: true });
    }

    try {
      await member.voice.setMute(muteAction);

      const actionText = muteAction ? 'muted' : 'unmuted';
      const actionColor = muteAction ? '#FF0000' : '#00FF00';

      const muteEmbed = new EmbedBuilder()
        .setColor(actionColor)
        .setTitle(`You Have Been Voice ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} in ${interaction.guild.name}`)
        .setDescription(`**Reason: ${reason}**`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();
      try {
        await member.send({ embeds: [muteEmbed] });
      } catch (error) {
        console.error(`Failed to send mute/unmute message to ${member.user.tag}: ${error}`);
      }

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(actionColor)
          .setTitle("Voice Mute/Unmute Logs")
          .setDescription(`${interaction.user} ${actionText} a user:`)
          .addFields(
            { name: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`, value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error(`Failed to find the log channel with ID ${config.botlogs}`);
      }

      return interaction.reply({ content: `${member.user.tag} has been voice ${actionText} for "${reason}".`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: `There was an error trying to ${muteAction ? 'mute' : 'unmute'} the member.`, ephemeral: true });
    }
  },
};
