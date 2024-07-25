const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

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
    
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.commandmanagement.clear.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(messages, true);

      await interaction.reply({ content: `Successfully cleared ${messages.size} messages.`, ephemeral: true });

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
