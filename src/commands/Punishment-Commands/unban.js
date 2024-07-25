const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to unban (ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for unbanning the user')
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.unban.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userToUnban = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      // Unban the user
      await interaction.guild.members.unban(userToUnban, reason);

      // Create an embed for the unban log
      const unbanEmbed = new EmbedBuilder()
        .setColor('#00FF00')  // Green color for unban actions
        .setTitle("User Unban Logs")
        .setDescription(`${interaction.user} unbanned a user:`)
        .addFields(
          { name: 'Unbanned User', value: `${userToUnban.tag} (${userToUnban.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      // Send the unban log to the specified channel
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        await logChannel.send({ embeds: [unbanEmbed] });
      } else {
        console.error(`Failed to find the log channel with ID ${config.botlogs}`);
      }

      // Reply to the interaction
      return interaction.reply({ content: `Successfully unbanned ${userToUnban.tag}.`, ephemeral: true });
    } catch (error) {
      console.error(`Error unbanning user: ${error}`);
      return interaction.reply({ content: 'There was an error trying to unban this user. They may not be banned, or there might be an issue with Discord.', ephemeral: true });
    }
  },
};
