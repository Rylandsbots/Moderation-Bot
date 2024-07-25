const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('createrole')
    .setDescription('Creates a new role in the server')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the new role')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('The color of the role (hex code)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('hoisted')
        .setDescription('Whether the role should be displayed separately in the member list')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('mentionable')
        .setDescription('Whether the role should be mentionable')
        .setRequired(false)
    ),

  async execute(interaction) {
    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemanagement.createrole.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if the bot has permission to manage roles
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'I do not have permission to manage roles.', ephemeral: true });
    }

    const name = interaction.options.getString('name');
    const color = interaction.options.getString('color') || '#000000';
    const hoisted = interaction.options.getBoolean('hoisted') || false;
    const mentionable = interaction.options.getBoolean('mentionable') || false;

    try {
      const newRole = await interaction.guild.roles.create({
        name: name,
        color: color,
        hoist: hoisted,
        mentionable: mentionable,
        reason: `Created by ${interaction.user.tag}`
      });

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('New Role Created')
        .addFields(
          { name: 'Name', value: newRole.name, inline: true },
          { name: 'Color', value: newRole.hexColor, inline: true },
          { name: 'Hoisted', value: newRole.hoist ? 'Yes' : 'No', inline: true },
          { name: 'Mentionable', value: newRole.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Created By', value: interaction.user.tag, inline: false }
        )
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Log the action
      const logChannel = interaction.guild.channels.cache.get(config.botlogs);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor(color)
          .setTitle("Role Creation Logs")
          .setDescription(`${interaction.user} created a new role:`)
          .addFields(
            { name: 'Role Name', value: newRole.name, inline: true },
            { name: 'Role ID', value: newRole.id, inline: true },
            { name: 'Color', value: newRole.hexColor, inline: true },
            { name: 'Hoisted', value: newRole.hoist ? 'Yes' : 'No', inline: true },
            { name: 'Mentionable', value: newRole.mentionable ? 'Yes' : 'No', inline: true }
          )
          .setThumbnail(botAvatarURL)
          .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Error creating role:', error);
      await interaction.reply({ content: 'There was an error while creating the role.', ephemeral: true });
    }
  },
};