const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleterole')
    .setDescription('Delete a role from the server')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to delete')
        .setRequired(true)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemanagement.deleterole.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const roleToDelete = interaction.options.getRole('role');

    // Check if the bot has permission to manage roles
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
    }

    // Check if the bot's highest role is lower than the role to be deleted
    if (interaction.guild.members.me.roles.highest.position <= roleToDelete.position) {
      return interaction.reply({ content: 'I cannot delete a role that is higher than or equal to my highest role.', ephemeral: true });
    }

    // Prevent deletion of @everyone role
    if (roleToDelete.id === interaction.guild.id) {
      return interaction.reply({ content: 'The @everyone role cannot be deleted.', ephemeral: true });
    }

    try {
      const roleName = roleToDelete.name;
      await roleToDelete.delete(`Deleted by ${interaction.user.tag}`);
      await interaction.reply(`The role "${roleName}" has been deleted.`);

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle("Role Deletion Logs")
          .setDescription(`${interaction.user} deleted a role:`)
          .addFields(
            { name: 'Role Name', value: roleName, inline: true },
            { name: 'Role ID', value: roleToDelete.id, inline: true }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      await interaction.reply({ content: 'There was an error while deleting the role.', ephemeral: true });
    }
  },
};