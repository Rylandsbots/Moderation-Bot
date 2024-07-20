const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get information about')
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

    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    // Fetch the user's profile
    const userProfile = await user.fetch(true);

    const embed = new EmbedBuilder()
      .setColor(member ? member.displayHexColor : '#000000')
      .setTitle(`User Information - ${user.tag}`)
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true }
      )
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    if (member) {
      // Get status
      let status = 'Offline';
      let statusEmoji = '⚫'; // Default to offline
      if (member.presence) {
        switch (member.presence.status) {
          case 'online':
            status = 'Online';
            statusEmoji = '🟢';
            break;
          case 'idle':
            status = 'Idle';
            statusEmoji = '🟡';
            break;
          case 'dnd':
            status = 'Do Not Disturb';
            statusEmoji = '🔴';
            break;
        }
      }

      embed.addFields(
        { name: 'Status', value: `${statusEmoji} ${status}`, inline: true },
        { name: 'Nickname', value: member.nickname || 'None', inline: true },
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Highest Role', value: member.roles.highest.toString(), inline: true }
      );

      // Add custom status if available
      if (member.presence && member.presence.activities.length > 0) {
        const customStatus = member.presence.activities.find(activity => activity.type === 'CUSTOM');
        if (customStatus) {
          let customStatusText = '';
          if (customStatus.emoji) {
            customStatusText += customStatus.emoji.toString() + ' ';
          }
          customStatusText += customStatus.state || 'No text';
          embed.addFields({ name: 'Custom Status', value: customStatusText, inline: true });
        }
      }

      // Add other activities if available
      if (member.presence && member.presence.activities.length > 0) {
        const activities = member.presence.activities.filter(activity => activity.type !== 'CUSTOM');
        if (activities.length > 0) {
          const activityStrings = activities.map(activity => {
            let activityString = `**${activity.type}**: ${activity.name}`;
            if (activity.details) activityString += `\n${activity.details}`;
            if (activity.state) activityString += `\n${activity.state}`;
            return activityString;
          });
          embed.addFields({ name: 'Activities', value: activityStrings.join('\n\n'), inline: true });
        }
      }

      // Add roles
      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .join(', ');
      embed.addFields({ name: 'Roles', value: roles || 'No roles', inline: false });

      // Add voice state if user is in a voice channel
      if (member.voice.channel) {
        embed.addFields({ name: 'Voice Channel', value: member.voice.channel.name, inline: true });
      }
    }

    // Add banner if available
    if (userProfile.banner) {
      embed.setImage(userProfile.bannerURL({ dynamic: true, size: 512 }));
    }

    await interaction.reply({ embeds: [embed] });
  },
};
