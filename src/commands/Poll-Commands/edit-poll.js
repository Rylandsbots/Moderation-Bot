const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../settings.js');

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
        .setName('editpoll')
        .setDescription('Edit an existing poll')
        .addStringOption(option =>
            option.setName('uuid')
                .setDescription('The UUID of the poll to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The new poll question'))
        .addStringOption(option =>
            option.setName('timer')
                .setDescription('Set a new timer for the poll')
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
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('New Option 1'))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('New Option 2'))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('New Option 3'))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('New Option 4'))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('New Option 5'))
        .addStringOption(option =>
            option.setName('option6')
                .setDescription('New Option 6'))
        .addStringOption(option =>
            option.setName('option7')
                .setDescription('New Option 7'))
        .addStringOption(option =>
            option.setName('option8')
                .setDescription('New Option 8'))
        .addStringOption(option =>
            option.setName('option9')
                .setDescription('New Option 9'))
        .addStringOption(option =>
            option.setName('option10')
                .setDescription('New Option 10')),

    async execute(interaction) {
        const commandmanagement = require('../../commands-settings.json');
        const ALLOWED_ROLE_IDS = commandmanagement.pollmanagement.editpoll.roleids;
        const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
    
        if (!hasPermission) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`🛑 You do not have permission to use this command. ${interaction.commandName}`);
    
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const pollUuid = interaction.options.getString('uuid');
        const newQuestion = interaction.options.getString('question');
        const newTimer = interaction.options.getString('timer');

        const polls = readPollsDatabase();
        const pollIndex = polls.findIndex(poll => poll.id === pollUuid);

        if (pollIndex === -1) {
            return interaction.reply({ content: 'Poll not found. Please check the UUID and try again.', ephemeral: true });
        }

        const poll = polls[pollIndex];

        // Update question if provided
        if (newQuestion) {
            poll.question = newQuestion;
        }

        // Update timer if provided
        if (newTimer) {
            const now = new Date();
            poll.endsAt = new Date(now.getTime() + TIMER_OPTIONS[newTimer]).toISOString();
        }

        // Update options if provided
        const newOptions = [];
        for (let i = 1; i <= 10; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) newOptions.push(option);
        }

        if (newOptions.length >= 2) {
            poll.options = newOptions;
        }

        // Update the poll in the database
        polls[pollIndex] = poll;
        writePollsDatabase(polls);

        // Edit the original message with updated information
        const channel = await interaction.client.channels.fetch(poll.channelId);
        const message = await channel.messages.fetch(poll.messageId);

        const updatedEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 ' + poll.question)
            .setDescription(poll.options.map((opt, index) => `${EMOJI_NUMBERS[index]} ${opt}`).join('\n'))
            .setFooter({ text: `Poll ends at: ${new Date(poll.endsAt).toLocaleString()}` })
            .setTimestamp();

        await message.edit({ embeds: [updatedEmbed] });

        // Clear existing reactions and add new ones if options changed
        if (newOptions.length >= 2) {
            await message.reactions.removeAll();
            for (let i = 0; i < poll.options.length; i++) {
                await message.react(EMOJI_NUMBERS[i]);
            }
        }

        await interaction.reply({ content: 'Poll updated successfully!', ephemeral: true });
    },
};
