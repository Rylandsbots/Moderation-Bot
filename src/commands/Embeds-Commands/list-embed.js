const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

// Path to the JSON file
const dbPath = path.join(__dirname, '..', '..', 'databases', 'embeds.json');

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

const rolePermissions = {
  moderators: true,
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listembeds')
    .setDescription('List all saved embeds'),

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

    // Read the database
    const embeds = readDatabase();

    if (embeds.length === 0) {
      return interaction.reply({ content: 'No embeds found in the database.', ephemeral: true });
    }

    // Create the embed for the list
    const listEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('List of Saved Embeds')
      .setDescription('Here are all the saved embeds:')
      .setFooter({ text: `Total embeds: ${embeds.length}` });

    // Add fields for each embed
    embeds.forEach((embed, index) => {
      listEmbed.addFields({
        name: `${index + 1}. ${embed.title}`,
        value: `ID: \`${embed.id}\``,
        inline: false
      });
    });

    // Send the list embed
    await interaction.reply({ embeds: [listEmbed] });

    // Log the list action
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle("Embed List Viewed")
        .setDescription(`${interaction.user} viewed the list of embeds`)
        .addFields(
          { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Total Embeds', value: embeds.length.toString(), inline: true }
        )
        .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Failed to find the log channel with ID ${config.botlogs}`);
    }
  },
};
