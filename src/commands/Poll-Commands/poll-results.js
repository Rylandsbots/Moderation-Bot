const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');

const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];



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
        .setName('pollresults')
        .setDescription('Get the results of a specific poll')
        .addStringOption(option =>
            option.setName('uuid')
                .setDescription('The UUID of the poll to get results for')
                .setRequired(true)),

    async execute(interaction) {
        const commandmanagement = require('../../commands-settings.json');
        const ALLOWED_ROLE_IDS = commandmanagement.pollmanagement.pollresults.roleids;
        const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
    
        if (!hasPermission) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
    
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const pollUuid = interaction.options.getString('uuid');

        const polls = readPollsDatabase();
        const poll = polls.find(p => p.id === pollUuid);

        if (!poll) {
            return interaction.editReply({ content: 'Poll not found. Please check the UUID and try again.', ephemeral: true });
        }

        try {
            const channel = await interaction.client.channels.fetch(poll.channelId);
            const message = await channel.messages.fetch(poll.messageId);

            const results = poll.options.map((option, index) => {
                const reaction = message.reactions.cache.get(EMOJI_NUMBERS[index]);
                return {
                    option: option,
                    votes: reaction ? reaction.count - 1 : 0, // Subtract 1 to exclude the bot's reaction
                    emoji: EMOJI_NUMBERS[index]
                };
            });

            results.sort((a, b) => b.votes - a.votes);

            const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);

            let resultText = results.map((result) => {
                const percentage = totalVotes > 0 ? (result.votes / totalVotes * 100).toFixed(2) : 0;
                return `${result.emoji} ${result.option}: ${result.votes} vote${result.votes !== 1 ? 's' : ''} (${percentage}%)`;
            }).join('\n');

            const now = new Date();
            const endTime = new Date(poll.endsAt);
            const isActive = endTime > now;

            const botAvatarURL = interaction.client.user.displayAvatarURL();

            const resultEmbed = new EmbedBuilder()
                .setColor(isActive ? 0x0099FF : 0x00FF00)
                .setTitle(`📊 Poll Results: ${poll.question}`)
                .setDescription(resultText)
                .addFields(
                    { name: 'Total Votes', value: totalVotes.toString(), inline: true },
                    { name: 'Status', value: isActive ? '🟢 Active' : '🔴 Ended', inline: true },
                    { name: 'End Time', value: endTime.toLocaleString(), inline: true }
                )
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `Poll ID: ${poll.id}`, iconURL: botAvatarURL })
                .setTimestamp();

            await interaction.editReply({ embeds: [resultEmbed], ephemeral: true });

        } catch (error) {
            console.error('Error fetching poll results:', error);
            await interaction.editReply({ content: 'An error occurred while fetching the poll results. The poll message may have been deleted.', ephemeral: true });
        }
    },
};
