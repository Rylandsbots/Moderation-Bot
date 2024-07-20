const { EmbedBuilder, GatewayIntentBits } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    const config = require('../settings.js'); // Import your configuration file

    // Make sure to enable the GUILD_MEMBERS intent in your client
    client.on('guildMemberAdd', async (member) => {
      // Define the role ID to be assigned
      const roleId = config.newmemberrole;
      const roleToAssign = member.guild.roles.cache.get(roleId);
      const botAvatarURL = client.user.displayAvatarURL({ dynamic: true });

      // Assign the role to the new member
      await member.roles.add(roleToAssign);

      // Create a new embed with the provided structure
      const welcomeEmbed = new EmbedBuilder()
        .setAuthor({
          name: member.guild.name,
          iconURL: "https://imgur.com/qYvEi3e.png",
        })
        .setTitle("Welcome New Member")
        .setDescription(`${config.welcomemsg.replace('{member}', member.toString())}\n\n**User Information**\n- Account Username: ${member.user.username}\n- Account Creation Date: ${member.user.createdAt.toDateString()}\n- Account Discord ID: ${member.id}`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: client.user.username, iconURL: botAvatarURL })
        .setColor("#41f500")
        .setTimestamp();

      // Define the channel ID where you want to send the welcome message
      const channelId = config.welcomechannel;
      const welcomeChannel = member.guild.channels.cache.get(channelId);

      // Send the welcome message to the channel
      await welcomeChannel.send({ embeds: [welcomeEmbed] });

      // Send a separate message mentioning the new member
      await welcomeChannel.send(`${member}!`);
    });
  },
};
