const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const MEMBERS_PER_PAGE = 15; // Number of members to display per page
const rolePermissions = {
  moderators: true,
  founders: true
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolemembers')
    .setDescription('Lists all members who have a specific role')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to list members for')
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
    await interaction.deferReply({ ephemeral: true });
    const role = interaction.options.getRole('role');
    if (!role) {
      return interaction.editReply({ content: 'Unable to find the specified role.', ephemeral: true });
    }

    const members = Array.from(role.members.values()).sort((a, b) => a.user.username.localeCompare(b.user.username));
    const memberCount = members.length;

    if (memberCount === 0) {
      return interaction.editReply({ content: `No members have the role ${role.name}.`, ephemeral: true });
    }

    const totalPages = Math.ceil(memberCount / MEMBERS_PER_PAGE);
    const embeds = [];

    for (let i = 0; i < totalPages; i++) {
      const start = i * MEMBERS_PER_PAGE;
      const end = Math.min((i + 1) * MEMBERS_PER_PAGE, memberCount);

      const embed = new EmbedBuilder()
        .setColor(role.color)
        .setTitle(`Members with ${role.name} role`)
        .setDescription(`Showing ${start + 1}-${end} of ${memberCount} members`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      let membersText = '';
      members.slice(start, end).forEach((member, index) => {
        membersText += `${start + index + 1}. ${member.user.tag}\n`;
      });

      embed.addFields({ name: 'Members', value: membersText });
      embeds.push(embed);
    }

    await interaction.editReply({ embeds: [embeds[0]], ephemeral: true });

    for (let i = 1; i < embeds.length; i++) {
      await interaction.followUp({ embeds: [embeds[i]], ephemeral: true });
    }

    // Log the action
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle("Role Members Command Used")
        .setDescription(`${interaction.user} requested a list of members for a role:`)
        .addFields(
          { name: 'Role Name', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true },
          { name: 'Member Count', value: memberCount.toString(), inline: true }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  },
};
