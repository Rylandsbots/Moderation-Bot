const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about the current server'),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const guild = interaction.guild;
    
    await guild.fetch();

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
    const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
    const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
    const roleCount = guild.roles.cache.size - 1;

    const embed = new EmbedBuilder()
      .setColor('#0000FF')
      .setTitle(`${guild.name} Server Information`)
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: 'Members', value: `Total: ${totalMembers}\nOnline: ${onlineMembers}`, inline: true },
        { name: 'Channels', value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`, inline: true },
        { name: 'Roles', value: `${roleCount}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
        { name: 'Boost Count', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true }
      )
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
