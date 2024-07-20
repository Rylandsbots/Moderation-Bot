const { EmbedBuilder } = require('discord.js');
const config = require('../settings.js');

module.exports = {
  name: 'ready', 
  once: true,
  execute: async function(client) {



    const joinChannelId = config.botlogs;
    const leaveChannelId = config.botlogs;

    const joinChannel = client.channels.cache.get(joinChannelId);
    const leaveChannel = client.channels.cache.get(leaveChannelId);

    function sendJoinEmbed(newState) {

      const member = newState.member;
  const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Member Joined Voice Channel')
        .setThumbnail(botAvatarURL)
       .setFooter({ text: client.user.username, iconURL: botAvatarURL })
        .addFields(
          { name: 'Member', value: `<@${member.user.id}>`, inline: false },
          { name: 'Channel', value: newState.channel.name, inline: false },
          { name: 'Joined At', value: new Date().toLocaleString(), inline: false }
        )
        .setTimestamp();
      
      joinChannel.send({embeds: [embed]});
    }

    function sendLeaveEmbed(oldState) {
      const member = oldState.member;
  const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Member Left Voice Channel')
        .setThumbnail(botAvatarURL)
       .setFooter({ text: client.user.username, iconURL: botAvatarURL })
        .addFields(
          { name: 'Member', value: `<@${member.user.id}>`, inline: false },
          { name: 'Channel', value: oldState.channel.name, inline: false },
          { name: 'Left At', value: new Date().toLocaleString(), inline: false }  
        )
        .setTimestamp();

      leaveChannel.send({embeds: [embed]});
    }

    function handleVoiceStateUpdate(oldState, newState) {
      const joined = !oldState.channel && newState.channel;
      const left = oldState.channel && !newState.channel;

      if (joined) {
        sendJoinEmbed(newState);
      } else if (left) {
        sendLeaveEmbed(oldState);
      }
    }

    client.on('voiceStateUpdate', handleVoiceStateUpdate);

  }
}
