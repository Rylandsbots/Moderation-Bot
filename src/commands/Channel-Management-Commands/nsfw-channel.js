const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nsfw')
    .setDescription('Toggle NSFW status for a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to toggle NSFW status (default: current channel)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.commandmanagement.nsfw.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (!channel.isTextBased() || channel.isDMBased()) {
      return interaction.reply({ content: 'NSFW status can only be set for server text channels.', ephemeral: true });
    }

    try {
      const newNsfwStatus = !channel.nsfw;
      await channel.setNSFW(newNsfwStatus);

      const statusMessage = newNsfwStatus ? 'enabled' : 'disabled';
      await interaction.reply(`NSFW status has been ${statusMessage} for ${channel}.`);

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(newNsfwStatus ? '#FF0000' : '#00FF00')
          .setTitle("NSFW Status Change Logs")
          .setDescription(`${interaction.user} changed NSFW status:`)
          .addFields(
            { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
            { name: 'New Status', value: newNsfwStatus ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Changed By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error toggling NSFW status:', error);
      await interaction.reply({ content: 'There was an error while toggling the NSFW status.', ephemeral: true });
    }
  },
};
