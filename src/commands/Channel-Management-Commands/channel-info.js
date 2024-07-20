const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Display information about a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to get information about')
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

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const createdTimestamp = Math.floor(channel.createdAt.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Channel Information: #${channel.name}`)
      
      .addFields(
        { name: 'Channel ID', value: channel.id, inline: true },
        { name: 'Type', value: channel.type.toString(), inline: true },
        { name: 'Created At', value: `<t:${createdTimestamp}:F>`, inline: true },
        { name: 'Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
        { name: 'Position', value: channel.position.toString(), inline: true },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true }
      )
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    if (channel.topic) {
      embed.addFields({ name: 'Topic', value: channel.topic });
    }

    if (channel.isTextBased()) {
      embed.addFields(
        { name: 'Slowmode', value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser} seconds` : 'Off', inline: true }
      );
    }

    // Add permission information
    const permissions = channel.permissionOverwrites.cache;
    let permissionInfo = '';

    permissions.forEach((perm, id) => {
      const role = interaction.guild.roles.cache.get(id);
      const member = interaction.guild.members.cache.get(id);
      const name = role ? role.name : member ? member.user.username : 'Unknown';

      permissionInfo += `\n**${name}**:\n`;
      const allowed = perm.allow.toArray();
      const denied = perm.deny.toArray();

      if (allowed.length) permissionInfo += `Allowed: ${allowed.join(', ')}\n`;
      if (denied.length) permissionInfo += `Denied: ${denied.join(', ')}\n`;
    });

    if (permissionInfo) {
      embed.addFields({ name: 'Permission Overwrites', value: permissionInfo || 'No specific overwrites' });
    } else {
      embed.addFields({ name: 'Permission Overwrites', value: 'No specific overwrites' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
