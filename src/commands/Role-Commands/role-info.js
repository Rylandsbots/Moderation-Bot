const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../settings.js');
const rolePermissions = {
  moderators: true,
  founders: true
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Displays information about a specific role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to get information about')
        .setRequired(true)
    ),

  async execute(interaction) {
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );

    if (!hasPermission) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    const role = interaction.options.getRole('role');

    if (!role) {
      return interaction.reply({ content: 'Unable to find the specified role.', ephemeral: true });
    }

    const createdAt = role.createdAt.toUTCString();
    const hexColor = role.hexColor;
    const memberCount = role.members.size;

    // Get all permissions
    const permissions = role.permissions.toArray();
    const allPermissions = permissions.length > 0 ? permissions.join(', ') : 'None';

    const embed = new EmbedBuilder()
      .setColor(hexColor)
      .setTitle(`Role Information: ${role.name}`)
      .addFields(
        { name: 'Role ID', value: role.id, inline: true },
        { name: 'Color', value: hexColor, inline: true },
        { name: 'Position', value: role.position.toString(), inline: true },
        { name: 'Created At', value: createdAt, inline: false },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
        { name: 'Members', value: memberCount.toString(), inline: false },
        { name: 'Permissions', value: allPermissions, inline: false }
      )
      .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log the action
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle("Role Info Command Used")
        .setDescription(`${interaction.user} requested information about a role:`)
        .addFields(
          { name: 'Role Name', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] });
    }
  },
};
