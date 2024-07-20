const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const ROLES_PER_EMBED = 25;
const rolePermissions = {
  moderators: true,
  founders: true
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('listroles')
    .setDescription('Lists all roles in the server.'),
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

    try {
      const roles = Array.from(interaction.guild.roles.cache.values())
        .sort((a, b) => b.position - a.position)
        .filter(role => role.id !== interaction.guild.id);

      const totalRoles = roles.length;
      const embedsNeeded = Math.ceil(totalRoles / ROLES_PER_EMBED);

      const embeds = [];

      for (let i = 0; i < embedsNeeded; i++) {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`Server Roles (Page ${i + 1}/${embedsNeeded})`)
          .setDescription(`Total Roles: ${totalRoles}`)
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        const startIndex = i * ROLES_PER_EMBED;
        const endIndex = Math.min((i + 1) * ROLES_PER_EMBED, totalRoles);

        let rolesString = roles.slice(startIndex, endIndex)
          .map(role => role.name)
          .join('\n');

        embed.addFields({ name: 'Roles', value: rolesString || 'No roles to display.' });
        embeds.push(embed);
      }

      await interaction.editReply({ embeds: [embeds[0]] });

      for (let i = 1; i < embeds.length; i++) {
        await interaction.followUp({ embeds: [embeds[i]], ephemeral: true });
      }

      // Log the action
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle("Role List Command Used")
          .setDescription(`${interaction.user} used the list roles command.`)
          .addFields(
            { name: 'Total Roles', value: totalRoles.toString(), inline: true },
            { name: 'Embeds Sent', value: embedsNeeded.toString(), inline: true }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Error in listroles command:', error);
      await interaction.editReply({ content: 'An error occurred while fetching roles. Please try again later.', ephemeral: true });
    }
  },
};
