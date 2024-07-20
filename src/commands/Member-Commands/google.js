const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const googleIt = require('google-it');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('google')
        .setDescription('Search Google for information')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('What you want to search for')
                .setRequired(true)),
    async execute(interaction) {
        if (isChannelLocked && interaction.channelId !== allowedChannelId) {
            return interaction.reply({ 
                content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
                ephemeral: true 
            });
        }

        const botAvatarURL = interaction.client.user.displayAvatarURL();
        await interaction.deferReply();
        const query = interaction.options.getString('query');
        try {
            const results = await googleIt({
                query: query,
                limit: 5,
                disableConsole: true
            });
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Google Search Results for: ${query}`)
                .setDescription(results.map((result, index) =>
                    `${index + 1}. [${result.title}](${result.link})\n${result.snippet}`
                ).join('\n\n'))
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in Google search:', error);
            await interaction.editReply('An error occurred while searching. Please try again later.');
        }
    },
};
