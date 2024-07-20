const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');
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
  founders: true
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editembed')
    .setDescription('Edit a saved embed')
    .addStringOption(option =>
      option.setName('embedid')
        .setDescription('The ID of the embed to edit')
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
    const embedIndex = embeds.findIndex(embed => embed.id === embedId);

    if (embedIndex === -1) {
      return interaction.reply({ content: 'No embed found with the provided ID.', ephemeral: true });
    }

    const embedData = embeds[embedIndex];

    // Create the modal for editing
    const modal = new ModalBuilder()
      .setCustomId('editEmbedModal')
      .setTitle('Edit Embed');

    const titleInput = new TextInputBuilder()
      .setCustomId('titleInput')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setValue(embedData.title)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('descriptionInput')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(embedData.description)
      .setRequired(true);

    const colorInput = new TextInputBuilder()
      .setCustomId('colorInput')
      .setLabel('Color (hex code)')
      .setStyle(TextInputStyle.Short)
      .setValue(embedData.color)
      .setRequired(true);

    const footerInput = new TextInputBuilder()
      .setCustomId('footerInput')
      .setLabel('Footer')
      .setStyle(TextInputStyle.Short)
      .setValue(embedData.footer || '')
      .setRequired(false);

    const imageInput = new TextInputBuilder()
      .setCustomId('imageInput')
      .setLabel('Image URL')
      .setStyle(TextInputStyle.Short)
      .setValue(embedData.image || '')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(footerInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    // Show the modal to the user
    await interaction.showModal(modal);

    // Wait for the modal submission
    const filter = (interaction) => interaction.customId === 'editEmbedModal';
    const submission = await interaction.awaitModalSubmit({ filter, time: 120000 }).catch(error => {
      console.error(error);
      return null;
    });

    if (!submission) {
      return interaction.followUp({ content: 'Embed editing timed out.', ephemeral: true });
    }

    // Update the embed data
    embedData.title = submission.fields.getTextInputValue('titleInput');
    embedData.description = submission.fields.getTextInputValue('descriptionInput');
    embedData.color = submission.fields.getTextInputValue('colorInput');
    embedData.footer = submission.fields.getTextInputValue('footerInput') || null;
    embedData.image = submission.fields.getTextInputValue('imageInput') || null;
    embedData.lastEditedBy = interaction.user.id;
    embedData.lastEditedAt = Math.floor(Date.now() / 1000);

    // Update the database
    embeds[embedIndex] = embedData;
    writeDatabase(embeds);

    // Create the updated embed
    const updatedEmbed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color);

    if (embedData.footer) updatedEmbed.setFooter({ text: embedData.footer });
    if (embedData.image) updatedEmbed.setImage(embedData.image);

    // Send the updated embed
    await submission.reply({ content: 'Embed updated successfully:', embeds: [updatedEmbed] });

    // Log the embed editing
    const logChannel = interaction.guild.channels.cache.get(config.botlogs);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle("Embed Edited")
        .setDescription(`${interaction.user} edited an embed:`)
        .addFields(
          { name: 'Embed ID', value: embedId, inline: true },
          { name: 'Edited by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
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
