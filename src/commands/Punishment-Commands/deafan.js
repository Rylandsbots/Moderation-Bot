const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('deafen')
    .setDescription('Server deafen or undeafen a user in voice channels')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to deafen/undeafen (mention or ID)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('deafen')
        .setDescription('True to deafen, False to undeafen')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the deafen/undeafen')
        .setRequired(true)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.defan.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userInput = interaction.options.getUser('user');
    const deafenAction = interaction.options.getBoolean('deafen');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(userInput.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: 'Invalid user or user not found in the server.', ephemeral: true });
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot deafen/undeafen myself.', ephemeral: true });
    }

    if (!member.voice.channel) {
      return interaction.reply({ content: 'The specified member is not in a voice channel.', ephemeral: true });
    }

    try {
      await member.voice.setDeaf(deafenAction);

      const actionText = deafenAction ? 'deafened' : 'undeafened';
      const actionColor = deafenAction ? '#FF0000' : '#00FF00';

      const deafenEmbed = new EmbedBuilder()
        .setColor(actionColor)
        .setTitle(`You Have Been Voice ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} in ${interaction.guild.name}`)
        .setDescription(`**Reason: ${reason}**`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();
      try {
        await member.send({ embeds: [deafenEmbed] });
      } catch (error) {
        console.error(`Failed to send deafen/undeafen message to ${member.user.tag}: ${error}`);
      }

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(actionColor)
          .setTitle("Voice Deafen/Undeafen Logs")
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
      return interaction.reply({ content: `There was an error trying to ${deafenAction ? 'deafen' : 'undeafen'} the member.`, ephemeral: true });
    }
  },
};
