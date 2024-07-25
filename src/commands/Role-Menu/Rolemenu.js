const { SlashCommandBuilder, EmbedBuilder, CollectorFilter } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../settings.js');
const dbRoleMenu = path.join(__dirname, '..', '..', 'databases', 'rolemenus.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createrolemenu')
    .setDescription('Create a role menu with up to 10 roles')
    .addStringOption(option =>
      option.setName('groupname')
        .setDescription('The name of the role group')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('embed_title')
        .setDescription('Custom title for the embed (optional)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('embed_description')
        .setDescription('Custom description for the embed (optional)')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role1')
        .setDescription('First role')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role2')
        .setDescription('Second role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role3')
        .setDescription('Third role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role4')
        .setDescription('Fourth role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role5')
        .setDescription('Fifth role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role6')
        .setDescription('Sixth role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role7')
        .setDescription('Seventh role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role8')
        .setDescription('Eighth role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role9')
        .setDescription('Ninth role')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role10')
        .setDescription('Tenth role')
        .setRequired(false)),

  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.rolemenumanagement.createrolemenu.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const groupName = interaction.options.getString('groupname');
    const embedTitle = interaction.options.getString('embed_title') || `Role Menu: ${groupName}`;
    const embedDescription = interaction.options.getString('embed_description') || 'React to get the corresponding role:';

    const roles = [];

    // Collect roles
    for (let i = 1; i <= 10; i++) {
      const role = interaction.options.getRole(`role${i}`);
      if (role) {
        roles.push(role);
      }
    }

    if (roles.length === 0) {
      return interaction.editReply('You must provide at least one role.');
    }

    // Ask for emojis
    await interaction.editReply(`Please provide an emoji for each role. You have 30 seconds for each emoji.\nSend the emojis one by one in separate messages.`);

    const emojis = [];
    const filter = m => m.author.id === interaction.user.id;

    for (const role of roles) {
      await interaction.followUp({ content: `Please send an emoji for the role: ${role.name}`, ephemeral: true });
      try {
        const collected = await interaction.channel.awaitMessages({
          filter,
          max: 1,
          time: 30000,
          errors: ['time']
        });
        const emoji = collected.first().content.trim();
        emojis.push(emoji);
      } catch (error) {
        return interaction.followUp({ content: 'You did not provide an emoji in time. Role menu creation cancelled.', ephemeral: true });
      }
    }

    // Create role menu data
    const roleMenuData = {
      id: uuidv4(),
      groupName: groupName,
      embedTitle: embedTitle,
      embedDescription: embedDescription,
      roles: roles.map((role, index) => ({
        id: role.id,
        name: role.name,
        emoji: emojis[index]
      }))
    };
 const botAvatarURL = interaction.client.user.displayAvatarURL();
    // Create embed for role menu
    const embed = new EmbedBuilder()
      .setTitle(embedTitle)
      .setDescription(embedDescription)
      .setColor('#0099ff')
   .setThumbnail(botAvatarURL)
 .addFields(
    {
      name: "Add And Remove Roles From Your Self",
      value: "Click on the reactions to add and remove roles from your self.",
      inline: false
    },
  )

          .setFooter({ text: `Created BY: ${interaction.user.tag}`, iconURL: botAvatarURL });

    roleMenuData.roles.forEach(role => {
      embed.addFields({ name: role.name, value: `${role.emoji}`, inline: true });
    });

    const message = await interaction.channel.send({ embeds: [embed] });

    // Add message ID to roleMenuData
    roleMenuData.messageId = message.id;

    // Add reactions to the message
    for (const emoji of emojis) {
      await message.react(emoji);
    }

    // Save to database
    let rolemenus = [];
    if (fs.existsSync(dbRoleMenu)) {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
    }

    const index = rolemenus.findIndex(menu => menu.id === roleMenuData.id);
    if (index !== -1) {
      rolemenus[index] = roleMenuData;
    } else {
      rolemenus.push(roleMenuData);
    }

    fs.writeFileSync(dbRoleMenu, JSON.stringify(rolemenus, null, 2));

    interaction.followUp({ content: 'Role menu created successfully!', ephemeral: true });
  },
};
