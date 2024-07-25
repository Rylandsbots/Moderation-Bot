const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');
const { v4: uuidv4 } = require('uuid');

// Path to the JSON file
const dbPath = path.join(__dirname, '..', '..', 'databases', 'kicks.json');

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
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick (mention or ID)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(true)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.punishmentmanagement.kick.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
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
      return interaction.reply({ content: 'I cannot kick myself.', ephemeral: true });
    }

    const kickEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`You Have Been Kicked From ${interaction.guild.name}`)
      .setDescription(`**Reason for Your Kick: ${reason}**`)
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    try {
      await user.send({ embeds: [kickEmbed] });
    } catch (error) {
      console.error(`Failed to send kick message to ${user.tag}: ${error}`);
    }

    let kickData;
    try {
      await interaction.guild.members.kick(user, reason);

      // Insert kick information into the JSON file
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      kickData = {
        id: uuidv4(),
        userId: user.id,
        userTag: user.tag,
        reason: reason,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        timestamp: timestamp
      };

      const kicks = readDatabase();
      kicks.push(kickData);
      writeDatabase(kicks);

      console.log(`Kick data for ${user.tag} inserted into the JSON file with UUID: ${kickData.id}`);
    } catch (error) {
      console.error(`Failed to kick ${user.tag}: ${error}`);
      return interaction.reply({ content: 'Failed to kick the user. Please try again later.', ephemeral: true });
    }

    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle("User Kick Logs")
        .setDescription(`${interaction.user} kicked a user:`)
        .addFields(
          { name: 'Kicked User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Kick ID', value: kickData.id, inline: false }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Failed to find the log channel with ID ${config.botlogs}`);
    }

    return interaction.reply({ content: `${user.tag} has been kicked for "${reason}". Kick ID: ${kickData.id}`, ephemeral: true });
  },
};
