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



module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteaction')
    .setDescription('Delete a warn, kick, ban, or timeout action')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('The type of action to delete')
        .setRequired(true)
        .addChoices(
          { name: 'Warn', value: 'warn' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Timeout', value: 'timeout' }
        )
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user associated with the action')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('uuid')
        .setDescription('The UUID of the action to delete')
        .setRequired(true)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.deleteaction.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const action = interaction.options.getString('action');
    const user = interaction.options.getUser('user');
    const uuid = interaction.options.getString('uuid');

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
    const index = data.findIndex(item => item.id === uuid && item.userId === user.id);

    if (index === -1) {
      return interaction.reply({ content: `No ${action} found with the given UUID for this user.`, ephemeral: true });
    }

    const removedAction = data.splice(index, 1)[0];
    writeDatabase(dbPath, data);

    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')  // Orange color for deletion actions
        .setTitle("Action Deletion Logs")
        .setDescription(`${interaction.user} deleted a ${action} action:`)
        .addFields(
          { name: 'Action Type', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Action UUID', value: uuid, inline: false },
          { name: 'Original Reason', value: removedAction.reason || 'N/A', inline: false },
          { name: 'Original Moderator', value: `${removedAction.moderatorTag} (${removedAction.moderatorId})`, inline: false },
          { name: 'Deleted by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
        )
        .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

      if (action === 'timeout') {
        logEmbed.addFields(
          { name: 'Original Duration', value: `${removedAction.duration} seconds`, inline: true },
          { name: 'Original Expiry', value: `<t:${removedAction.expiresAt}:F>`, inline: true }
        );
      }

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Failed to find the log channel with ID ${config.botlogs}`);
    }

    return interaction.reply({ content: `The ${action} with UUID ${uuid} for ${user.tag} has been deleted.`, ephemeral: true });
  },
};
