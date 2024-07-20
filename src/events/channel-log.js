const { EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
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

    function getChannelType(type) {
      const types = {
        [ChannelType.GuildText]: 'Text',
        [ChannelType.GuildVoice]: 'Voice',
        [ChannelType.GuildCategory]: 'Category',
        [ChannelType.GuildNews]: 'News',
        [ChannelType.GuildStore]: 'Store',
        [ChannelType.GuildStageVoice]: 'Stage',
        [ChannelType.GuildForum]: 'Forum',
      };
      return types[type] || 'Unknown';
    }

    async function fetchAuditLog(guild, event) {
      const auditLog = await guild.fetchAuditLogs({ type: event, limit: 1 });
      return auditLog.entries.first();
    }

    client.on('channelCreate', async (channel) => {
      const auditLog = await fetchAuditLog(channel.guild, AuditLogEvent.ChannelCreate);
      const executor = auditLog ? auditLog.executor : null;

      const embed = createLogEmbed(
        "Channel Creation Logs",
        `A new channel was created${executor ? ` by ${executor.tag}` : ''}:`,
        [
          { name: 'Channel Name', value: channel.name, inline: true },
          { name: 'Channel ID', value: channel.id, inline: true },
          { name: 'Channel Type', value: getChannelType(channel.type), inline: true },
          { name: 'Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
        ]
      );

      if (executor) {
        embed.addFields({ name: 'Created By', value: `${executor.tag} (${executor.id})`, inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('channelDelete', async (channel) => {
      const auditLog = await fetchAuditLog(channel.guild, AuditLogEvent.ChannelDelete);
      const executor = auditLog ? auditLog.executor : null;

      const embed = createLogEmbed(
        "Channel Deletion Logs",
        `A channel was deleted${executor ? ` by ${executor.tag}` : ''}:`,
        [
          { name: 'Channel Name', value: channel.name, inline: true },
          { name: 'Channel ID', value: channel.id, inline: true },
          { name: 'Channel Type', value: getChannelType(channel.type), inline: true },
          { name: 'Category', value: channel.parent ? channel.parent.name : 'None', inline: true },
        ]
      );

      if (executor) {
        embed.addFields({ name: 'Deleted By', value: `${executor.tag} (${executor.id})`, inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('channelUpdate', async (oldChannel, newChannel) => {
      const auditLog = await fetchAuditLog(newChannel.guild, AuditLogEvent.ChannelUpdate);
      const executor = auditLog ? auditLog.executor : null;

      const changes = [];

      if (oldChannel.name !== newChannel.name) {
        changes.push({ name: 'Name', value: `${oldChannel.name} -> ${newChannel.name}`, inline: true });
      }
      if (oldChannel.type !== newChannel.type) {
        changes.push({ name: 'Type', value: `${getChannelType(oldChannel.type)} -> ${getChannelType(newChannel.type)}`, inline: true });
      }
      if (oldChannel.parent !== newChannel.parent) {
        changes.push({ name: 'Category', value: `${oldChannel.parent?.name || 'None'} -> ${newChannel.parent?.name || 'None'}`, inline: true });
      }
      if (oldChannel.topic !== newChannel.topic) {
        changes.push({ name: 'Topic', value: `${oldChannel.topic || 'None'} -> ${newChannel.topic || 'None'}`, inline: false });
      }

      if (changes.length > 0) {
        const embed = createLogEmbed(
          "Channel Update Logs",
          `The channel ${oldChannel.name} (${oldChannel.id}) was updated${executor ? ` by ${executor.tag}` : ''}:`,
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
