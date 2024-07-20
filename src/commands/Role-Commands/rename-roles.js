const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
  moderators: false,
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('renamerole')
    .setDescription('Renames an existing role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to rename')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('The new name for the role')
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

    const role = interaction.options.getRole('role');
    const newName = interaction.options.getString('newname');

    // Check if the bot's highest role is lower than the role to be renamed
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ content: 'I cannot rename a role that is higher than or equal to my highest role.', ephemeral: true });
    }

    // Prevent renaming of @everyone role
    if (role.id === interaction.guild.id) {
      return interaction.reply({ content: 'The @everyone role cannot be renamed.', ephemeral: true });
    }

    const oldName = role.name;

    try {
      await role.setName(newName, `Renamed by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle('Role Renamed')
        .addFields(
          { name: 'Old Name', value: oldName, inline: true },
          { name: 'New Name', value: newName, inline: true },
          { name: 'Role ID', value: role.id, inline: false },
          { name: 'Renamed By', value: interaction.user.tag, inline: false }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(role.color)
          .setTitle("Role Rename Logs")
          .setDescription(`${interaction.user} renamed a role:`)
          .addFields(
            { name: 'Old Name', value: oldName, inline: true },
            { name: 'New Name', value: newName, inline: true },
            { name: 'Role ID', value: role.id, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Error renaming role:', error);
      await interaction.reply({ content: 'There was an error while renaming the role.', ephemeral: true });
    }
  },
};