const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

// Paths to the JSON files
const warnsPath = path.join(__dirname, '..', '..', 'databases', 'warns.json');
const kicksPath = path.join(__dirname, '..', '..', 'databases', 'kicks.json');
const bansPath = path.join(__dirname, '..', '..', 'databases', 'bans.json');
const timeoutsPath = path.join(__dirname, '..', '..', 'databases', 'timeouts.json');

// Function to read a JSON file
function readDatabase(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database file ${filePath}:`, error);
    return [];
  }
}

// Function to write to a JSON file
function writeDatabase(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to database file ${filePath}:`, error);
  }
}

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editaction')
    .setDescription('Edit the reason for a warn, kick, ban, or timeout action')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('The type of action to edit')
        .setRequired(true)
        .addChoices(
          { name: 'Warn', value: 'warn' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Timeout', value: 'timeout' }
        )
    )
    .addStringOption(option =>
      option
        .setName('uuid')
        .setDescription('The UUID of the action to edit')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('new_reason')
        .setDescription('The new reason for the action')
        .setRequired(true)
    ),

  async execute(interaction) {
  const botAvatarURL = interaction.client.user.displayAvatarURL();
    // Check if the user has the required role
    const hasPermission = interaction.member.roles.cache.some(role => 
      (role.id === config.modpermissions && rolePermissions.moderators) ||
      (role.id === config.ownerpermissions && rolePermissions.founders)
    );

    if (!hasPermission) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const action = interaction.options.getString('action');
    const uuid = interaction.options.getString('uuid');
    const newReason = interaction.options.getString('new_reason');

    let dbPath;
    let dbName;
    switch (action) {
      case 'warn':
        dbPath = warnsPath;
        dbName = 'warns';
        break;
      case 'kick':
        dbPath = kicksPath;
        dbName = 'kicks';
        break;
      case 'ban':
        dbPath = bansPath;
        dbName = 'bans';
        break;
      case 'timeout':
        dbPath = timeoutsPath;
        dbName = 'timeouts';
        break;
    }

    const data = readDatabase(dbPath);
    const index = data.findIndex(item => item.id === uuid);

    if (index === -1) {
      return interaction.reply({ content: `No ${action} found with the given UUID.`, ephemeral: true });
    }

    const oldReason = data[index].reason;
    data[index].reason = newReason;
    writeDatabase(dbPath, data);

    const logChannelId = config.botlogs;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`${action.charAt(0).toUpperCase() + action.slice(1)} Reason Edited`)
        .addFields(
          { name: 'Action UUID', value: uuid },
          { name: 'Edited by', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Old Reason', value: oldReason || 'N/A' },
          { name: 'New Reason', value: newReason },
          { name: 'User', value: `<@${data[index].userId}>` },
          { name: 'Original Moderator', value: `${data[index].moderatorTag} (${data[index].moderatorId})` }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      if (action === 'timeout') {
        logEmbed.addFields(
          { name: 'Duration', value: `${data[index].duration} seconds` },
          { name: 'Expires At', value: `<t:${data[index].expiresAt}:F>` }
        );
      }

      logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Failed to find the log channel with ID ${logChannelId}`);
    }

    return interaction.reply({ content: `The reason for the ${action} with UUID ${uuid} has been updated.`, ephemeral: true });
  },
};
