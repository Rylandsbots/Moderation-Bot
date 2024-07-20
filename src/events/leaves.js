const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    const config = require('../settings.js'); // Import your configuration file

    // Make sure to enable the GUILD_MEMBERS intent in your client
    client.on('guildMemberRemove', async (member) => {
      const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });

      // Create a new embed
      const leaveEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setAuthor({
          name: member.guild.name,
          iconURL: "https://imgur.com/qYvEi3e.png",
        })
        .setTitle('Member Left')
        .setDescription(`${config.leavemsg.replace('{member}', member.user.username)}\n\n**User Information**\n- Account Username: ${member.user.username}\n- Account Creation Date: ${member.user.createdAt.toDateString()}\n- Account Discord ID: ${member.id}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: client.user.username, iconURL: botAvatarURL })
        .setTimestamp();

      // Define the channel ID where you want to send the leave message
      const channelId = config.leavechannel;
      const leaveChannel = member.guild.channels.cache.get(channelId);

      // Send the leave message to the channel
      await leaveChannel.send({ embeds: [leaveEmbed] });

      // Optionally, you can add a separate message mentioning the user who left
      await leaveChannel.send(`${member.user.username}`);
    });
  },
};
