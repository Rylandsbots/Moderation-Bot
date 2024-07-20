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

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewpunishments')
    .setDescription('View a user\'s punishments')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('The type of punishment to view')
        .setRequired(true)
        .addChoices(
          { name: 'Warns', value: 'warns' },
          { name: 'Kicks', value: 'kicks' },
          { name: 'Bans', value: 'bans' },
          { name: 'Timeouts', value: 'timeouts' }
        )
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to view punishments for')
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

    const punishmentType = interaction.options.getString('type');
    const user = interaction.options.getUser('user');

    let dbPath;
    let dbName;
    switch (punishmentType) {
      case 'warns':
        dbPath = warnsPath;
        dbName = 'Warnings';
        break;
      case 'kicks':
        dbPath = kicksPath;
        dbName = 'Kicks';
        break;
      case 'bans':
        dbPath = bansPath;
        dbName = 'Bans';
        break;
      case 'timeouts':
        dbPath = timeoutsPath;
        dbName = 'Timeouts';
        break;
    }

    const data = readDatabase(dbPath);
    const userPunishments = data.filter(item => item.userId === user.id);

    if (userPunishments.length === 0) {
      return interaction.reply({ content: `No ${dbName.toLowerCase()} found for ${user.tag}.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${dbName} for ${user.tag}`)
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    userPunishments.forEach((punishment, index) => {
      let fieldValue = `
        **UUID:** ${punishment.id}
        **Reason:** ${punishment.reason || 'N/A'}
        **Moderator:** ${punishment.moderatorTag}
        **Date:** ${new Date(punishment.timestamp * 1000).toLocaleString()}
      `;

      if (punishmentType === 'timeouts') {
        fieldValue += `
        **Duration:** ${punishment.duration} seconds
        **Expires:** <t:${punishment.expiresAt}:F>
        `;
      }

      embed.addFields(
        { name: `${dbName.slice(0, -1)} #${index + 1}`, value: fieldValue }
      );
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
