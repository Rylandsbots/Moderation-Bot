const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

const TIMER_OPTIONS = {
    '1 Minute': 60 * 1000,
    '5 Minutes': 5 * 60 * 1000,
    '15 Minutes': 15 * 60 * 1000,
    '30 Minutes': 30 * 60 * 1000,
    '1 Hour': 60 * 60 * 1000,
    '2 Hours': 2 * 60 * 60 * 1000,
    '4 Hours': 4 * 60 * 60 * 1000,
    '8 Hours': 8 * 60 * 60 * 1000,
    '12 Hours': 12 * 60 * 60 * 1000,
    '24 Hours': 24 * 60 * 60 * 1000,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('Set a reminder for yourself')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to remind you')
                .setRequired(true)
                .addChoices(
                    { name: '1 Minute', value: '1 Minute' },
                    { name: '5 Minutes', value: '5 Minutes' },
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
            option.setName('message')
                .setDescription('What to remind you about')
                .setRequired(true)),

    async execute(interaction) {
        if (isChannelLocked && interaction.channelId !== allowedChannelId) {
            return interaction.reply({ 
                content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
                ephemeral: true 
            });
        }

        const botAvatarURL = interaction.client.user.displayAvatarURL();
        const time = interaction.options.getString('time');
        const message = interaction.options.getString('message');

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you about: "${message}"`)
            .setThumbnail(botAvatarURL)
            .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        await interaction.followUp({
            content: '⚠️ **Warning:**\n```diff\n- If the bot crashes or restarts at any point in time, this reminder will stop working. We will be updating this once we have a good system in place to remember current reminders and timers activated. Sorry for any inconveniences this causes.\n```',
            ephemeral: true
        });

        setTimeout(async () => {
            const reminderEmbed = new EmbedBuilder()
                .setColor(0xFF9900)
                .setTitle('⏰ Reminder!')
                .setDescription(`You asked me to remind you about: "${message}"`)
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
                .setTimestamp();

            await interaction.followUp({
                content: `<@${interaction.user.id}>, here's your reminder!`,
                embeds: [reminderEmbed],
                ephemeral: true
            });
        }, TIMER_OPTIONS[time]);
    },
};
