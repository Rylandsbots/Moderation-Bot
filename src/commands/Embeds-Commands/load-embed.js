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
    .setName('loadembed')
    .setDescription('Load and display a saved embed')
    .addStringOption(option =>
      option.setName('embedid')
        .setDescription('The ID of the embed to load')
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

    const embedId = interaction.options.getString('embedid');

    // Read the database
    const embeds = readDatabase();

    // Find the embed with the matching ID
    const embedData = embeds.find(embed => embed.id === embedId);

    if (!embedData) {
      return interaction.reply({ content: 'No embed found with the provided ID.', ephemeral: true });
    }

    // Create the embed from the saved data
    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color);

    if (embedData.footer) embed.setFooter({ text: embedData.footer });
    if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
    if (embedData.image) embed.setImage(embedData.image);

    // Send the embed
    await interaction.channel.send({ embeds: [embed] });

    // Log the embed loading
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#0000FF')
        .setTitle("Embed Loaded")
        .setDescription(`${interaction.user} loaded an embed:`)
        .addFields(
          { name: 'Embed ID', value: embedId, inline: true },
          { name: 'Loaded by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Original Creator', value: `${embedData.creatorTag} (${embedData.creatorId})`, inline: true }
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
