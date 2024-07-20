const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');
const config = require('../../settings.js');
const { v4: uuidv4 } = require('uuid');

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

// Function to write to the JSON file
function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

const rolePermissions = {
  moderators: false,
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createembed')
    .setDescription('Creates a custom embed')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('The title of the embed')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('The color of the embed (hex code)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('footer')
        .setDescription('The footer text of the embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('The URL of the thumbnail image')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('The URL of the main image')
        .setRequired(false)
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

    // Create the modal for the description input
    const modal = new ModalBuilder()
      .setCustomId('embedDescriptionModal')
      .setTitle('Embed Description');
    const descriptionInput = new TextInputBuilder()
      .setCustomId('descriptionInput')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    const actionRow = new ActionRowBuilder().addComponents(descriptionInput);
    modal.addComponents(actionRow);

    // Show the modal to the user
    await interaction.showModal(modal);

    // Wait for the modal submission
    const filter = (interaction) => interaction.customId === 'embedDescriptionModal';
    const submission = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(error => {
      console.error(error);
      return null;
    });

    if (!submission) {
      return interaction.followUp({ content: 'Embed creation timed out.', ephemeral: true });
    }

    // Get the description from the modal submission
    const description = submission.fields.getTextInputValue('descriptionInput');

    // Get other options from the interaction
    const title = interaction.options.getString('title');
    const color = interaction.options.getString('color');
    const footer = interaction.options.getString('footer');
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color);
    if (footer) embed.setFooter({ text: footer });
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);

    // Generate a UUID for the embed
    const embedId = uuidv4();

    // Create embed data object
    const embedData = {
      id: embedId,
      title,
      description,
      color,
      footer,
      thumbnail,
      image,
      creatorId: interaction.user.id,
      creatorTag: interaction.user.tag,
      timestamp: Math.floor(Date.now() / 1000)
    };

    // Read current database, add new embed, and write back
    const embeds = readDatabase();
    embeds.push(embedData);
    writeDatabase(embeds);

    console.log(`Embed created by ${interaction.user.tag} and saved with UUID: ${embedId}`);

    // Send the embed
    await submission.reply({ embeds: [embed], content: `Embed created and saved with ID: ${embedId}` });

    // Log the embed creation
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle("Embed Creation Log")
        .setDescription(`${interaction.user} created a new embed:`)
        .addFields(
          { name: 'Embed ID', value: embedId, inline: true },
          { name: 'Creator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Title', value: title }
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
