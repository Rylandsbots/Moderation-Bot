const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');
const { v4: uuidv4 } = require('uuid');

// Path to the JSON file
const dbPath = path.join(__dirname, '..', '..', 'databases', 'bans.json');

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

const rolePermissions = {
  moderators: true,
  founders: false
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban (mention or ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the ban')
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

    const userInput = interaction.options.get('user').value;
    const reason = interaction.options.getString('reason');

    let user;
    try {
      user = await interaction.client.users.fetch(userInput);
    } catch (error) {
      return interaction.reply({ content: 'Invalid user ID or mention.', ephemeral: true });
    }

    if (user.id === interaction.client.user.id) {
      return interaction.reply({ content: 'I cannot ban myself.', ephemeral: true });
    }

    const banEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`You Have Been Banned From ${interaction.guild.name}`)
      .setDescription(`**Reason for Your Ban: ${reason}**`)
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    try {
      await user.send({ embeds: [banEmbed] });
    } catch (error) {
      console.error(`Failed to send ban message to ${user.tag}: ${error}`);
    }

    try {
      await interaction.guild.members.ban(user, { reason });

      // Insert ban information into the JSON file
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const banData = {
        id: uuidv4(), // Generate a UUID for the ban
        userId: user.id,
        userTag: user.tag,
        reason: reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        timestamp: timestamp
      };

      const bans = readDatabase();
      bans.push(banData);
      writeDatabase(bans);

      console.log(`Ban data for ${user.tag} inserted into the JSON file with UUID: ${banData.id}`);
    } catch (error) {
      console.error(`Failed to ban ${user.tag}: ${error}`);
      return interaction.reply({ content: 'Failed to ban the user. Please try again later.', ephemeral: true });
    }

    // Create and send the embed to the log channel
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle("User Ban Logs")
        .setDescription(`${interaction.user} banned a user:`)
        .addFields(
          { name: 'Banned User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Failed to find the log channel with ID ${config.botlogs}`);
    }

    return interaction.reply({ content: `${user.tag} has been banned for "${reason}".`, ephemeral: true });
  },
};
