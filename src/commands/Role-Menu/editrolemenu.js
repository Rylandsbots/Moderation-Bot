const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../settings.js');
const dbRoleMenu = path.join(__dirname, '..', '..', 'databases', 'rolemenus.json');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('editrolemenu')
    .setDescription('Edit an existing role menu')
    .addStringOption(option =>
      option.setName('uuid')
        .setDescription('The UUID of the role menu to edit')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('groupname')
        .setDescription('New name for the role group'))
    .addStringOption(option =>
      option.setName('embed_title')
        .setDescription('New title for the embed'))
    .addStringOption(option =>
      option.setName('embed_description')
        .setDescription('New description for the embed'))
    .addRoleOption(option =>
      option.setName('add_role')
        .setDescription('Add a new role to the menu'))
    .addRoleOption(option =>
      option.setName('remove_role')
        .setDescription('Remove a role from the menu')),

  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemenumanagement.editrolemenu.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    // Read the existing role menus
    let rolemenus = [];
    if (fs.existsSync(dbRoleMenu)) {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
    }

    const uuid = interaction.options.getString('uuid');
    const menuIndex = rolemenus.findIndex(menu => menu.id === uuid);

    if (menuIndex === -1) {
      return interaction.editReply('No role menu found with the provided UUID.');
    }

    const menu = rolemenus[menuIndex];

    // Update group name if provided
    const newGroupName = interaction.options.getString('groupname');
    if (newGroupName) {
      menu.groupName = newGroupName;
    }

    // Update embed title if provided
    const newEmbedTitle = interaction.options.getString('embed_title');
    if (newEmbedTitle) {
      menu.embedTitle = newEmbedTitle;
    }

    // Update embed description if provided
    const newEmbedDescription = interaction.options.getString('embed_description');
    if (newEmbedDescription) {
      menu.embedDescription = newEmbedDescription;
    }

    // Add new role if provided
    const roleToAdd = interaction.options.getRole('add_role');
    if (roleToAdd) {
      if (!menu.roles.some(role => role.id === roleToAdd.id)) {
        await interaction.followUp({ content: `Please send an emoji for the role: ${roleToAdd.name}`, ephemeral: true });
        try {
          const collected = await interaction.channel.awaitMessages({
            filter: m => m.author.id === interaction.user.id,
            max: 1,
            time: 30000,
            errors: ['time']
          });
          const emoji = collected.first().content.trim();
          menu.roles.push({
            id: roleToAdd.id,
            name: roleToAdd.name,
            emoji: emoji
          });
        } catch (error) {
          return interaction.followUp({ content: 'You did not provide an emoji in time. Role not added.', ephemeral: true });
        }
      } else {
        await interaction.followUp({ content: `Role ${roleToAdd.name} is already in the menu.`, ephemeral: true });
      }
    }

    // Remove role if provided
    const roleToRemove = interaction.options.getRole('remove_role');
    if (roleToRemove) {
      const roleIndex = menu.roles.findIndex(role => role.id === roleToRemove.id);
      if (roleIndex !== -1) {
        menu.roles.splice(roleIndex, 1);
        await interaction.followUp({ content: `Role ${roleToRemove.name} removed from the menu.`, ephemeral: true });
      } else {
        await interaction.followUp({ content: `Role ${roleToRemove.name} is not in the menu.`, ephemeral: true });
      }
    }

    // Update the embed
 const botAvatarURL = interaction.client.user.displayAvatarURL();
    const embed = new EmbedBuilder()
      .setTitle(menu.embedTitle)
      .setDescription(menu.embedDescription)
      .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
 .addFields(
    {
      name: "Add And Remove Roles From Your Self",
      value: "Click on the reactions to add and remove roles from your self.",
      inline: false
    },
  )
          .setFooter({ text: `Edited By: ${interaction.user.tag}`, iconURL: botAvatarURL });

    menu.roles.forEach(role => {
      embed.addFields({ name: role.name, value: `${role.emoji}`, inline: true });
    });

    // Find the original message and edit it
    try {
      const channel = await interaction.client.channels.fetch(interaction.channelId);
      const message = await channel.messages.fetch(menu.messageId);
      await message.edit({ embeds: [embed] });

      // Update reactions
      await message.reactions.removeAll();
      for (const role of menu.roles) {
        await message.react(role.emoji);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      await interaction.followUp({ content: 'Error updating the role menu message. The data was updated, but the message couldn\'t be edited.', ephemeral: true });
    }

    // Save the updated role menus
    fs.writeFileSync(dbRoleMenu, JSON.stringify(rolemenus, null, 2));

    await interaction.editReply('Role menu updated successfully!');
  },
};
