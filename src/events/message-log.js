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

    client.on('messageCreate', message => {
      if (!message.author) return;
      if (message.author.bot) return;

      const embed = createLogEmbed(
        "Message Creation Logs",
        `A new message was sent by ${message.author}:`,
        [
          { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: 'Channel', value: `${message.channel.name} (${message.channel.id})`, inline: true },
          { name: 'Content', value: message.content || 'No text content', inline: false },
        ]
      );

      if (message.attachments.size > 0) {
        embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.url).join('\n'), inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('messageUpdate', (oldMessage, newMessage) => {
      if (!oldMessage.author) return;
      if (oldMessage.author.bot) return;

      const embed = createLogEmbed(
        "Message Edit Logs",
        `A message was edited by ${oldMessage.author}:`,
        [
          { name: 'Author', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
          { name: 'Channel', value: `${oldMessage.channel.name} (${oldMessage.channel.id})`, inline: true },
          { name: 'Old Content', value: oldMessage.content || 'No text content', inline: false },
          { name: 'New Content', value: newMessage.content || 'No text content', inline: false },
        ]
      );

      if (newMessage.attachments.size > 0) {
        embed.addFields({ name: 'Attachments', value: newMessage.attachments.map(a => a.url).join('\n'), inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });

    client.on('messageDelete', message => {
      if (!message.author) return;
      if (message.author.bot) return;

      const embed = createLogEmbed(
        "Message Deletion Logs",
        `A message was deleted, originally sent by ${message.author}:`,
        [
          { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: 'Channel', value: `${message.channel.name} (${message.channel.id})`, inline: true },
          { name: 'Content', value: message.content || 'No text content', inline: false },
        ]
      );

      if (message.attachments.size > 0) {
        embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.url).join('\n'), inline: false });
      }

      logChannel.send({ embeds: [embed] });
    });
  }
};
