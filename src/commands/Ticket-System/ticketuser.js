const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketuser')
    .setDescription('Add or remove a user from the current ticket')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to add to the ticket')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to remove from the ticket')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const commandmanagement = require('../../commands-settings.json');
    const ALLOWED_ROLE_IDS = commandmanagement.ticketmenumanagement.ticketuser.roleids;
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
  
    if (!hasPermission) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
  
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    // Check if the channel is a ticket
    if (!interaction.channel.name.endsWith('-ticket')) {
      return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');

    // Check if the user has permission to manage the ticket
    const managerRole = interaction.guild.roles.cache.find(role => role.name === 'Moderators');
    if (!managerRole || (!interaction.member.roles.cache.has(managerRole.id) && 
        interaction.user.id !== interaction.channel.topic)) {
      return interaction.reply({ content: 'You do not have permission to manage this ticket.', ephemeral: true });
    }

    // Check if the user is already in the ticket (for add) or not in the ticket (for remove)
    const isUserInTicket = interaction.channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel);

    if (subcommand === 'add') {
      if (isUserInTicket) {
        return interaction.reply({ content: `${user} is already in this ticket.`, ephemeral: true });
      }
      await addUserToTicket(interaction, user);
    } else if (subcommand === 'remove') {
      if (!isUserInTicket) {
        return interaction.reply({ content: `${user} is not in this ticket.`, ephemeral: true });
      }
      if (user.id === interaction.channel.topic) {
        return interaction.reply({ content: 'You cannot remove the ticket creator from the ticket.', ephemeral: true });
      }
      await removeUserFromTicket(interaction, user);
    }
  },
};

async function addUserToTicket(interaction, user) {
  try {
    await interaction.channel.permissionOverwrites.edit(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    await interaction.reply(`${user} has been added to the ticket.`);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Failed to add the user to the ticket.', ephemeral: true });
  }
}

async function removeUserFromTicket(interaction, user) {
  try {
    await interaction.channel.permissionOverwrites.delete(user);
    await interaction.reply(`${user} has been removed from the ticket.`);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Failed to remove the user from the ticket.', ephemeral: true });
  }
}
