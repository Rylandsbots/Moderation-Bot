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

// Function to write to the JSON file
function writePollsDatabase(data) {
    try {
        fs.writeFileSync(pollsDbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to polls database file:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletepoll')
        .setDescription('Delete a specific poll')
        .addStringOption(option =>
            option.setName('uuid')
                .setDescription('The UUID of the poll to delete')
                .setRequired(true)),

    async execute(interaction) {
        const hasPermission = interaction.member.roles.cache.some(role => 
            (role.id === config.modpermissions && rolePermissions.moderators) ||
            (role.id === config.ownerpermissions && rolePermissions.founders)
        );
      
        if (!hasPermission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const pollUuid = interaction.options.getString('uuid');

        const polls = readPollsDatabase();
        const pollIndex = polls.findIndex(poll => poll.id === pollUuid);

        if (pollIndex === -1) {
            return interaction.editReply({ content: 'Poll not found. Please check the UUID and try again.', ephemeral: true });
        }

        const pollToDelete = polls[pollIndex];

        // Remove the poll from the database
        polls.splice(pollIndex, 1);
        writePollsDatabase(polls);

        let responseMessage = `Poll with UUID ${pollUuid} has been deleted from the database.`;

        // Delete the poll message
        if (pollToDelete.channelId && pollToDelete.messageId) {
            try {
                const channel = await interaction.client.channels.fetch(pollToDelete.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(pollToDelete.messageId);
                    if (message) {
                        await message.delete();
                        responseMessage += ' The poll message has also been deleted from the channel.';
                    }
                }
            } catch (error) {
                console.error('Error deleting poll message:', error);
                responseMessage += ' However, there was an error deleting the poll message from the channel. It may have already been deleted or the bot lacks necessary permissions.';
            }
        } else {
            responseMessage += ' The poll message could not be deleted because the channel or message ID was not found in the database.';
        }

        await interaction.editReply({ content: responseMessage, ephemeral: true });

        // Log the deletion
        if (config.logChannelId) {
            try {
                const logChannel = await interaction.client.channels.fetch(config.logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Poll Deleted')
                        .setDescription(`A poll has been deleted by ${interaction.user.tag}`)
                        .addFields(
                            { name: 'Poll UUID', value: pollUuid },
                            { name: 'Poll Question', value: pollToDelete.question },
                            { name: 'Deleted By', value: interaction.user.tag },
                            { name: 'Channel', value: pollToDelete.channelId ? `<#${pollToDelete.channelId}>` : 'Unknown' }
                        )
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            } catch (error) {
                console.error('Error sending log message:', error);
            }
        }
    },
};
