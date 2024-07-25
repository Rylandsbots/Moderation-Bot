const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('managerole')
    .setDescription('Add or remove a role from a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to manage roles for')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to add or remove')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Whether to add or remove the role')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        )
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemanagement.managerole.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const action = interaction.options.getString('action');
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Check if the bot has permission to manage roles
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
    }

    // Check if the bot's highest role is lower than the role to be managed
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ content: 'I cannot manage a role that is higher than or equal to my highest role.', ephemeral: true });
    }

    try {
      if (action === 'add') {
        await member.roles.add(role);
        await interaction.reply(`Added the role ${role} to ${targetUser}.`);
      } else {
        await member.roles.remove(role);
        await interaction.reply(`Removed the role ${role} from ${targetUser}.`);
      }

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Role Management Logs")
          .setDescription(`${interaction.user} ${action === 'add' ? 'added' : 'removed'} a role:`)
          .addFields(
            { name: 'User', value: targetUser.toString(), inline: true },
            { name: 'Role', value: role.toString(), inline: true },
            { name: 'Action', value: action === 'add' ? 'Added' : 'Removed', inline: true }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error managing role:', error);
      await interaction.reply({ content: 'There was an error while managing the role.', ephemeral: true });
    }
  },
};