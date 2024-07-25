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
        .setName('loadpoll')
        .setDescription('Load and recreate a specific poll')
        .addStringOption(option =>
            option.setName('uuid')
                .setDescription('The UUID of the poll to load')
                .setRequired(true)),

    async execute(interaction) {
        const commandmanagement = require('../../commands-settings.json');
        const ALLOWED_ROLE_IDS = commandmanagement.pollmanagement.loadpoll.roleids;
        const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
    
        if (!hasPermission) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
    
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const pollUuid = interaction.options.getString('uuid');

        const polls = readPollsDatabase();
        const poll = polls.find(p => p.id === pollUuid);

        if (!poll) {
            return interaction.reply({ content: 'Poll not found. Please check the UUID and try again.', ephemeral: true });
        }

        const now = new Date();
        const endTime = new Date(poll.endsAt);
        const isActive = endTime > now;

        if (!isActive) {
            return interaction.reply({ content: 'This poll has already ended and cannot be loaded.', ephemeral: true });
        }

        const botAvatarURL = interaction.client.user.displayAvatarURL();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 ' + poll.question)
            .setDescription(poll.options.map((opt, index) => `${EMOJI_NUMBERS[index]} ${opt}`).join('\n'))
            .setThumbnail(botAvatarURL)
            .setFooter({ text: `Poll ends at: ${endTime.toLocaleString()}`, iconURL: botAvatarURL })
            .setTimestamp();

        const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

        for (let i = 0; i < poll.options.length; i++) {
            await pollMessage.react(EMOJI_NUMBERS[i]);
        }

        // Send a follow-up message to the user who loaded the poll
        await interaction.followUp({
            content: `Poll loaded successfully. UUID: ${poll.id}`,
            ephemeral: true
        });

        // Set timer to end the poll
        const timeLeft = endTime.getTime() - now.getTime();
        setTimeout(async () => {
            const fetchedMessage = await interaction.channel.messages.fetch(pollMessage.id);
            const results = poll.options.map((option, index) => {
                const reaction = fetchedMessage.reactions.cache.get(EMOJI_NUMBERS[index]);
                return {
                    option: option,
                    votes: reaction ? reaction.count - 1 : 0,
                    emoji: EMOJI_NUMBERS[index]
                };
            });

            results.sort((a, b) => b.votes - a.votes);

            let resultText = results.map((result) => 
                `${result.emoji} ${result.option}: ${result.votes} vote${result.votes !== 1 ? 's' : ''}`
            ).join('\n');

            const resultEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📊 Poll Results: ' + poll.question)
                .setDescription(resultText)
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `Poll created by ${interaction.user.tag}`, iconURL: botAvatarURL })
                .setTimestamp();

            await interaction.followUp({ embeds: [resultEmbed] });
        }, timeLeft);
    },
};
