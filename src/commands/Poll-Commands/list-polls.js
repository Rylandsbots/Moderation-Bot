const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');

const rolePermissions = {
    moderators: true,
    founders: true
};

// Path to the JSON file
const pollsDbPath = path.join(__dirname, '..', '..', 'databases', 'polls.json');

// Function to read the JSON file
function readPollsDatabase() {
    try {
        const data = fs.readFileSync(pollsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading polls database file:', error);
        return [];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpolls')
        .setDescription('List all active polls'),

    async execute(interaction) {
        const hasPermission = interaction.member.roles.cache.some(role => 
            (role.id === config.modpermissions && rolePermissions.moderators) ||
            (role.id === config.ownerpermissions && rolePermissions.founders)
        );
      
        if (!hasPermission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const polls = readPollsDatabase();

        if (polls.length === 0) {
            return interaction.reply({ content: 'There are no active polls at the moment.', ephemeral: true });
        }

        const now = new Date();
        const activePolls = polls.filter(poll => new Date(poll.endsAt) > now);

        if (activePolls.length === 0) {
            return interaction.reply({ content: 'There are no active polls at the moment.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Active Polls')
            .setDescription('Here are the currently active polls:')
            .setTimestamp();

        activePolls.forEach((poll, index) => {
            embed.addFields({
                name: `Poll ${index + 1}`,
                value: `**UUID:** ${poll.id}\n**Question:** ${poll.question}\n**Ends at:** ${new Date(poll.endsAt).toLocaleString()}\n**Channel:** <#${poll.channelId}>\n[Jump to Poll](https://discord.com/channels/${interaction.guildId}/${poll.channelId}/${poll.messageId})`
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
