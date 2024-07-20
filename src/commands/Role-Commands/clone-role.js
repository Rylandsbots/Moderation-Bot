const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: false,
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clonerole')
    .setDescription('Creates a new role with the same permissions and settings as an existing role')
    .addRoleOption(option =>
      option.setName('sourcerole')
        .setDescription('The role to clone')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('The name for the new cloned role')
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

    // Check if the bot has permission to manage roles
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
    }

    const sourceRole = interaction.options.getRole('sourcerole');
    const newName = interaction.options.getString('newname');

    // Check if the bot's highest role is lower than the role to be cloned
    if (interaction.guild.members.me.roles.highest.position <= sourceRole.position) {
      return interaction.reply({ content: 'I cannot clone a role that is higher than or equal to my highest role.', ephemeral: true });
    }

    try {
      const newRole = await interaction.guild.roles.create({
        name: newName,
        color: sourceRole.color,
        hoist: sourceRole.hoist,
        position: sourceRole.position,
        permissions: sourceRole.permissions,
        mentionable: sourceRole.mentionable,
        reason: `Cloned from ${sourceRole.name} by ${interaction.user.tag}`
      });

      const embed = new EmbedBuilder()
        .setColor(newRole.color)
        .setTitle('Role Cloned')
        .addFields(
          { name: 'Source Role', value: sourceRole.name, inline: true },
          { name: 'New Role', value: newRole.name, inline: true },
          { name: 'Color', value: newRole.hexColor, inline: true },
          { name: 'Hoisted', value: newRole.hoist ? 'Yes' : 'No', inline: true },
          { name: 'Mentionable', value: newRole.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Position', value: newRole.position.toString(), inline: true },
          { name: 'Permissions', value: newRole.permissions.toArray().join(', ') || 'None', inline: false }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

      // Log the action
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(newRole.color)
          .setTitle("Role Clone Logs")
          .setDescription(`${interaction.user} cloned a role:`)
          .addFields(
            { name: 'Source Role', value: sourceRole.name, inline: true },
            { name: 'New Role', value: newRole.name, inline: true },
            { name: 'New Role ID', value: newRole.id, inline: true }
          )
          .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Error cloning role:', error);
      await interaction.reply({ content: 'There was an error while cloning the role.', ephemeral: true });
    }
  },
};