const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');
const { v4: uuidv4 } = require('uuid');

const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const TIMER_OPTIONS = {
    '60 Seconds': 60 * 1000,
    '15 Minutes': 15 * 60 * 1000,
    '30 Minutes': 30 * 60 * 1000,
    '1 Hour': 60 * 60 * 1000,
    '2 Hours': 2 * 60 * 60 * 1000,
    '4 Hours': 4 * 60 * 60 * 1000,
    '8 Hours': 8 * 60 * 60 * 1000,
    '12 Hours': 12 * 60 * 60 * 1000,
    '24 Hours': 24 * 60 * 60 * 1000,
};

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
        .setName('poll')
        .setDescription('Create a poll with up to 10 options and a timer')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timer')
                .setDescription('Set a timer for the poll')
                .setRequired(true)
                .addChoices(
                    { name: '60 Seconds', value: '60 Seconds' },
                    { name: '15 Minutes', value: '15 Minutes' },
                    { name: '30 Minutes', value: '30 Minutes' },
                    { name: '1 Hour', value: '1 Hour' },
                    { name: '2 Hours', value: '2 Hours' },
                    { name: '4 Hours', value: '4 Hours' },
                    { name: '8 Hours', value: '8 Hours' },
                    { name: '12 Hours', value: '12 Hours' },
                    { name: '24 Hours', value: '24 Hours' },
                ))
        .addBooleanOption(option =>
            option.setName('mention_everyone')
                .setDescription('Mention everyone when creating the poll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('Option 1')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Option 2')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Option 3'))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Option 4'))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Option 5'))
        .addStringOption(option =>
            option.setName('option6')
                .setDescription('Option 6'))
        .addStringOption(option =>
            option.setName('option7')
                .setDescription('Option 7'))
        .addStringOption(option =>
            option.setName('option8')
                .setDescription('Option 8'))
        .addStringOption(option =>
            option.setName('option9')
                .setDescription('Option 9'))
        .addStringOption(option =>
            option.setName('option10')
                .setDescription('Option 10')),

    async execute(interaction) {
        const hasPermission = interaction.member.roles.cache.some(role => 
            (role.id === config.modpermissions && rolePermissions.moderators) ||
            (role.id === config.ownerpermissions && rolePermissions.founders)
        );
      
        if (!hasPermission) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const botAvatarURL = interaction.client.user.displayAvatarURL();
        const question = interaction.options.getString('question');
        const timer = interaction.options.getString('timer');
        const mentionEveryone = interaction.options.getBoolean('mention_everyone') || false;
        const options = [];
        for (let i = 1; i <= 10; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) options.push(option);
        }

        if (options.length < 2) {
            return interaction.reply({ content: 'You need at least 2 options for a poll!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 ' + question)
            .setDescription(options.map((opt, index) => `${EMOJI_NUMBERS[index]} ${opt}`).join('\n'))
            .setThumbnail(botAvatarURL)
            .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
            .setTimestamp();

        const content = mentionEveryone ? '@everyone A new poll has been created!' : '';
        const pollMessage = await interaction.reply({ content, embeds: [embed], fetchReply: true });

        for (let i = 0; i < options.length; i++) {
            await pollMessage.react(EMOJI_NUMBERS[i]);
        }

        // Store the poll information
        const pollId = uuidv4();
        const pollData = {
            id: pollId,
            messageId: pollMessage.id,
            channelId: interaction.channelId,
            question: question,
            options: options,
            createdAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + TIMER_OPTIONS[timer]).toISOString(),
            createdBy: interaction.user.id
        };

        const polls = readPollsDatabase();
        polls.push(pollData);
        writePollsDatabase(polls);

        await interaction.followUp({
            content: '⚠️ **Warning:**\n```diff\n- If your bot crashes or restarts, the poll will be remembered, but the timer might be affected. We\'re working on improving this system.\n```',
            ephemeral: true
        });

        // Set timer to end the poll
        setTimeout(async () => {
            const fetchedMessage = await interaction.channel.messages.fetch(pollMessage.id);
            const results = options.map((option, index) => {
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
                .setTitle('📊 Poll Results: ' + question)
                .setDescription(resultText)
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
                .setTimestamp();

            await interaction.channel.send({ embeds: [resultEmbed] });

            // Remove the poll from the database
            const updatedPolls = readPollsDatabase().filter(poll => poll.id !== pollId);
            writePollsDatabase(updatedPolls);
        }, TIMER_OPTIONS[timer]);
    },
};
