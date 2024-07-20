const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const config = require('../settings.js');
const { v4: uuidv4 } = require('uuid');

const bannedWords = [
  'Nigger', 'Spic', 'Chink', 'Jap', 'Kike', 'Sand Nigger', 'Porch Monkey', 'Coon',
  'Jigaboo', 'Spearchucker', 'Injun', 'Gook', 'Raghead', 'Camel Jockey',
  'Porcelain Doll', 'Yellow Man', 'Redskin', 'White Trash', 'Beaner', 'Fag',
  'Faggot', 'Shemale', 'Tranny', 'Lipstick Lesbian', 'Nigga', 'Border Hopper'
];

const warnsDbPath = path.join(__dirname, '..', '..', 'src', 'databases', 'warns.json');
const bansDbPath = path.join(__dirname, '..', '..', 'src', 'databases', 'bans.json');

function readDatabase(dbPath) {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return [];
  }
}

function writeDatabase(dbPath, data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

function countUserWarnings(userId) {
  const warnings = readDatabase(warnsDbPath);
  return warnings.filter(warning => warning.userId === userId).length;
}

async function banUser(guild, userId, reason) {
  try {
    const user = await guild.members.fetch(userId);
    await user.ban({ reason: reason });
    const banData = {
      id: uuidv4(),
      userId: userId,
      userTag: user.user.tag,
      reason: reason,
      moderatorId: guild.client.user.id,
      moderatorTag: guild.client.user.tag,
      timestamp: Math.floor(Date.now() / 1000)
    };
    const bans = readDatabase(bansDbPath);
    bans.push(banData);
    writeDatabase(bansDbPath, bans);
  } catch (error) {
    console.error(`Failed to ban user ${userId}:`, error);
  }
}

function containsBannedWord(message) {
  const messageContent = message.content;
  const regex = new RegExp(`\\b(${bannedWords.join('|')})\\b`, 'i');
  return regex.test(messageContent);
}

module.exports = {
  name: 'messageCreate',
  async execute(msg) {
    if (msg.author.bot) return;
    if (containsBannedWord(msg)) {
      try {
        const usedWord = bannedWords.find(word => msg.content.toLowerCase().includes(word.toLowerCase()));
        msg.delete();
        const warningCount = countUserWarnings(msg.author.id);
        if (warningCount >= 3) {
          const banReason = 'Received 4 or more warnings for using banned words';
          await banUser(msg.guild, msg.author.id, banReason);
          const botAvatarURL = msg.client.user.displayAvatarURL({ dynamic: true });
          const banEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('User Banned')
            .setDescription(`<@${msg.author.id}> has been banned from the server for repeated use of banned words.`)
            .setThumbnail(botAvatarURL)
            .setFooter({ text: msg.client.user.username, iconURL: botAvatarURL })
            .setTimestamp();
          await msg.channel.send({ embeds: [banEmbed] });
          const logChannel = msg.guild.channels.cache.get(config.botlogs);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle("User Ban Logs")
              .setDescription(`Automatic ban for repeated banned word usage:`)
              .addFields(
                { name: 'Banned User', value: `${msg.author.tag} (${msg.author.id})`, inline: true },
                { name: 'Moderator', value: `${msg.client.user.tag} (${msg.client.user.id})`, inline: true },
                { name: 'Reason', value: banReason, inline: false }
              )
              .setThumbnail(botAvatarURL)
              .setFooter({ text: msg.client.user.username, iconURL: botAvatarURL })
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          }
        } else {
          const botAvatarURL = msg.client.user.displayAvatarURL({ dynamic: true });
          const warningEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Inappropriate Language Detected')
            .setDescription(`<@${msg.author.id}>, this server is blocking the word "${usedWord}". Please refrain from using such language.`)
            .setThumbnail(botAvatarURL)
            .setFooter({ text: msg.client.user.username, iconURL: botAvatarURL })
            .setTimestamp();
          const warningMsg = await msg.channel.send({ embeds: [warningEmbed] });
          setTimeout(() => warningMsg.delete().catch(console.error), 10000);
          msg.author.send({ embeds: [warningEmbed] }).catch(error => {
            console.error("Couldn't send a DM to the user:", error);
          });
          const timestamp = Math.floor(Date.now() / 1000);
          const warningData = {
            id: uuidv4(),
            userId: msg.author.id,
            userTag: msg.author.tag,
            reason: `Used banned word: ${usedWord}`,
            moderatorId: msg.client.user.id,
            moderatorTag: msg.client.user.tag,
            timestamp: timestamp
          };
          const warnings = readDatabase(warnsDbPath);
          warnings.push(warningData);
          writeDatabase(warnsDbPath, warnings);
          const logChannel = msg.guild.channels.cache.get(config.botlogs);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor('#FFFF00')
              .setTitle("User Warning Logs")
              .setDescription(`Automatic warning for banned word usage:`)
              .addFields(
                { name: 'Warned User', value: `${msg.author.tag} (${msg.author.id})`, inline: true },
                { name: 'Moderator', value: `${msg.client.user.tag} (${msg.client.user.id})`, inline: true },
                { name: 'Reason', value: `Used banned word: ${usedWord}`, inline: false },
                { name: 'Warning ID', value: warningData.id, inline: false }
              )
              .setThumbnail(botAvatarURL)
              .setFooter({ text: msg.client.user.username, iconURL: botAvatarURL })
              .setTimestamp();
            logChannel.send({ embeds: [logEmbed] });
          } else {
            console.error(`Failed to find the log channel with ID ${config.botlogs}`);
          }
        }
      } catch (error) {
        console.error('Error handling banned word:', error);
      }
    }
  }
};
