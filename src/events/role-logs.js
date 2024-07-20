const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../settings.js');

module.exports = {
  name: 'ready',
  once: true,
  execute: async function(client) {


    const logChannel = client.channels.cache.get(config.botlogs);

    function createLogEmbed(title, description, fields) {
  const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });
      return new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setThumbnail(botAvatarURL)
       .setFooter({ text: client.user.username, iconURL: botAvatarURL })
        .setTimestamp();
    }

    function formatPermissions(permissions) {
      return permissions.toArray().join(', ') || 'None';
    }

    async function fetchAuditLog(guild, event) {
      const auditLog = await guild.fetchAuditLogs({ type: event, limit: 1 });
      return auditLog.entries.first();
    }

    client.on('roleCreate', async (role) => {
      const auditLog = await fetchAuditLog(role.guild, AuditLogEvent.RoleCreate);
      const executor = auditLog ? auditLog.executor : null;

      const embed = createLogEmbed(
        "Role Creation Logs",
        `A new role was created${executor ? ` by ${executor.tag}` : ''}:`,
        [
          { name: 'Role Name', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true },
          { name: 'Color', value: role.hexColor, inline: true },
          { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
          { name: 'Permissions', value: formatPermissions(role.permissions), inline: false },
        ]
      );

      if (executor) {
        embed.addFields({ name: 'Created By', value: `${executor.tag} (${executor.id})`, inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('roleDelete', async (role) => {
      const auditLog = await fetchAuditLog(role.guild, AuditLogEvent.RoleDelete);
      const executor = auditLog ? auditLog.executor : null;

      const embed = createLogEmbed(
        "Role Deletion Logs",
        `A role was deleted${executor ? ` by ${executor.tag}` : ''}:`,
        [
          { name: 'Role Name', value: role.name, inline: true },
          { name: 'Role ID', value: role.id, inline: true },
          { name: 'Color', value: role.hexColor, inline: true },
        ]
      );

      if (executor) {
        embed.addFields({ name: 'Deleted By', value: `${executor.tag} (${executor.id})`, inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('roleUpdate', async (oldRole, newRole) => {
      const auditLog = await fetchAuditLog(newRole.guild, AuditLogEvent.RoleUpdate);
      const executor = auditLog ? auditLog.executor : null;

      const changes = [];

      if (oldRole.name !== newRole.name) {
        changes.push({ name: 'Name', value: `${oldRole.name} -> ${newRole.name}`, inline: true });
      }
      if (oldRole.hexColor !== newRole.hexColor) {
        changes.push({ name: 'Color', value: `${oldRole.hexColor} -> ${newRole.hexColor}`, inline: true });
      }
      if (oldRole.hoist !== newRole.hoist) {
        changes.push({ name: 'Hoisted', value: `${oldRole.hoist ? 'Yes' : 'No'} -> ${newRole.hoist ? 'Yes' : 'No'}`, inline: true });
      }
      if (oldRole.mentionable !== newRole.mentionable) {
        changes.push({ name: 'Mentionable', value: `${oldRole.mentionable ? 'Yes' : 'No'} -> ${newRole.mentionable ? 'Yes' : 'No'}`, inline: true });
      }
      if (!oldRole.permissions.equals(newRole.permissions)) {
        changes.push({ name: 'Permissions', value: `${formatPermissions(oldRole.permissions)} -> ${formatPermissions(newRole.permissions)}`, inline: false });
      }

      if (changes.length > 0) {
        const embed = createLogEmbed(
          "Role Update Logs",
          `The role ${oldRole.name} (${oldRole.id}) was updated${executor ? ` by ${executor.tag}` : ''}:`,
          changes
        );

        if (executor) {
          embed.addFields({ name: 'Updated By', value: `${executor.tag} (${executor.id})`, inline: false });
        }

        logChannel.send({ embeds: [embed] });
      }
    });


  }
}
