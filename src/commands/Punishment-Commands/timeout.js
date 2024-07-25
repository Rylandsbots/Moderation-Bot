const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');
const { v4: uuidv4 } = require('uuid');

// Path to the JSON file
const dbPath = path.join(__dirname, '..', '..', 'databases', 'timeouts.json');

// Function to read the JSON file
function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return [];
  }
}

// Function to write to the JSON file
function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user in the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to timeout (mention or ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Timeout duration')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '1 hour', value: '3600' },
          { name: '1 day', value: '86400' },
          { name: '1 week', value: '604800' }
        )
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the timeout')
        .setRequired(true)
    ),

  async execute(interaction) {

  const botAvatarURL = interaction.client.user.displayAvatarURL();
  const commandmanagement = require('../../commands-settings.json');
  const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.timeout.roleids;
  const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

  if (!hasPermission) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

    const userInput = interaction.options.getUser('user');
    const durationInSeconds = parseInt(interaction.options.getString('duration'));
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(userInput.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: 'Invalid user or user not found in the server.', ephemeral: true });
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot timeout myself.', ephemeral: true });
    }

    try {
      await member.timeout(durationInSeconds * 1000, reason);

      const durationText = getDurationText(durationInSeconds);

      const timeoutEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`You Have Been Timed Out in ${interaction.guild.name}`)
        .setDescription(`**Duration: ${durationText}\nReason: ${reason}**`)
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      try {
        await member.send({ embeds: [timeoutEmbed] });
      } catch (error) {
        console.error(`Failed to send timeout message to ${member.user.tag}: ${error}`);
      }

      // Insert timeout information into the JSON file
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const timeoutData = {
        id: uuidv4(),
        userId: member.id,
        userTag: member.user.tag,
        duration: durationInSeconds,
        reason: reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        timestamp: timestamp,
        expiresAt: timestamp + durationInSeconds
      };

      const timeouts = readDatabase();
      timeouts.push(timeoutData);
      writeDatabase(timeouts);

      console.log(`Timeout data for ${member.user.tag} inserted into the JSON file with UUID: ${timeoutData.id}`);

      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle("User Timeout Logs")
          .setDescription(`${interaction.user} timed out a user:`)
          .addFields(
            { name: 'Timed Out User', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Duration', value: durationText, inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Timeout ID', value: timeoutData.id, inline: false }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error(`Failed to find the log channel with ID ${config.botlogs}`);
      }

      return interaction.reply({ content: `${member.user.tag} has been timed out for ${durationText}. Reason: "${reason}". Timeout ID: ${timeoutData.id}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'There was an error trying to timeout the member.', ephemeral: true });
    }
  },
};

function getDurationText(seconds) {
  if (seconds === 60) return '60 seconds';
  if (seconds === 300) return '5 minutes';
  if (seconds === 600) return '10 minutes';
  if (seconds === 3600) return '1 hour';
  if (seconds === 86400) return '1 day';
  if (seconds === 604800) return '1 week';
  return `${seconds} seconds`;
}
