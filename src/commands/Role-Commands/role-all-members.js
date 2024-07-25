const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bulkrole')
    .setDescription('Add or remove a role from multiple members at once')
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
    )
    .addRoleOption(option =>
      option.setName('targetrole')
        .setDescription('Apply to all members with this role (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemanagement.bulkrole.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if the bot has permission to manage roles
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    const action = interaction.options.getString('action');
    const targetRole = interaction.options.getRole('targetrole');

    // Check if the bot's highest role is lower than the role to be added/removed
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ content: 'I cannot manage a role that is higher than or equal to my highest role.', ephemeral: true });
    }

    await interaction.deferReply();

    let membersToUpdate;
    if (targetRole) {
      membersToUpdate = targetRole.members;
    } else {
      membersToUpdate = await interaction.guild.members.fetch();
    }

    let successCount = 0;
    let failCount = 0;

    for (const [memberId, member] of membersToUpdate) {
      try {
        if (action === 'add') {
          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            successCount++;
          }
        } else {
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            successCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to ${action} role for member ${memberId}:`, error);
        failCount++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(role.color)
      .setTitle(`Bulk Role ${action.charAt(0).toUpperCase() + action.slice(1)}`)
      .addFields(
        { name: 'Role', value: role.name, inline: true },
        { name: 'Action', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
        { name: 'Target Role', value: targetRole ? targetRole.name : 'All members', inline: true },
        { name: 'Successful Updates', value: successCount.toString(), inline: true },
        { name: 'Failed Updates', value: failCount.toString(), inline: true }
      )
      .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Log the action
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle("Bulk Role Update Logs")
        .setDescription(`${interaction.user} performed a bulk role update:`)
        .addFields(
          { name: 'Role', value: role.name, inline: true },
          { name: 'Action', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
          { name: 'Target Role', value: targetRole ? targetRole.name : 'All members', inline: true },
          { name: 'Successful Updates', value: successCount.toString(), inline: true },
          { name: 'Failed Updates', value: failCount.toString(), inline: true }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  },
};