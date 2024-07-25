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
  const commandmanagement = require('../../commands-settings.json');
  const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.viewpunishments.roleids;
  const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

  if (!hasPermission) {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
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
