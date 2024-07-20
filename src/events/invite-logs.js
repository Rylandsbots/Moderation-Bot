const { EmbedBuilder } = require('discord.js');
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

    function formatDuration(seconds) {
      if (seconds === 0) return 'Unlimited';
      
      const units = [
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
      ];
      
      const parts = [];
      
      for (const { label, seconds: unitSeconds } of units) {
        const count = Math.floor(seconds / unitSeconds);
        if (count > 0) {
          parts.push(`${count} ${label}${count !== 1 ? 's' : ''}`);
          seconds %= unitSeconds;
        }
      }
      
      return parts.join(', ');
    }

    client.on('inviteCreate', invite => {
      const embed = createLogEmbed(
        "Invite Creation Logs",
        `A new invite was created:`,
        [
          { name: 'Creator', value: `${invite.inviter.tag} (${invite.inviter.id})`, inline: true },
          { name: 'Channel', value: `${invite.channel.name} (${invite.channel.id})`, inline: true },
          { name: 'Code', value: invite.code, inline: true },
          { name: 'Max Uses', value: invite.maxUses === 0 ? 'Unlimited' : invite.maxUses.toString(), inline: true },
          { name: 'Max Age', value: formatDuration(invite.maxAge), inline: true },
          { name: 'Temporary', value: invite.temporary ? 'Yes' : 'No', inline: true },
        ]
      );

      logChannel.send({ embeds: [embed] });
    });

    client.on('inviteDelete', invite => {
      const embed = createLogEmbed(
        "Invite Deletion Logs",
        `An invite was deleted:`,
        [
          { name: 'Code', value: invite.code, inline: true },
          { name: 'Channel', value: invite.channel ? `${invite.channel.name} (${invite.channel.id})` : 'Unknown', inline: true },
          { name: 'Guild', value: invite.guild ? invite.guild.name : 'Unknown', inline: true },
        ]
      );

      logChannel.send({ embeds: [embed] });
    });

    // Invite tracking
    const guildInvites = new Map();

    client.guilds.cache.forEach(async (guild) => {
      const firstInvites = await guild.invites.fetch();
      guildInvites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
    });

    client.on('guildMemberAdd', async (member) => {
      const cachedInvites = guildInvites.get(member.guild.id);
      const newInvites = await member.guild.invites.fetch();
      
      try {
        const usedInvite = newInvites.find(invite => cachedInvites.get(invite.code) < invite.uses);
        
        if (usedInvite) {
          const embed = createLogEmbed(
            "Member Join Logs",
            `A new member joined the server:`,
            [
              { name: 'Member', value: `${member.user.tag} (${member.id})`, inline: true },
              { name: 'Invite Code', value: usedInvite.code, inline: true },
              { name: 'Inviter', value: `${usedInvite.inviter.tag} (${usedInvite.inviter.id})`, inline: true },
              { name: 'Invite Uses', value: `${usedInvite.uses}`, inline: true },
              { name: 'Invite Max Uses', value: usedInvite.maxUses === 0 ? 'Unlimited' : usedInvite.maxUses.toString(), inline: true },
              { name: 'Invite Expires', value: usedInvite.expiresAt ? `<t:${Math.floor(usedInvite.expiresAt.getTime() / 1000)}:R>` : 'Never', inline: true },
            ]
          );

          logChannel.send({ embeds: [embed] });
        }
      } catch (err) {
        // Error handling can be implemented here if needed
      }

      // Update the cached invites
      guildInvites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
    });

  }
}
