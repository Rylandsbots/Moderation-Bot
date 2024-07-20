const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

const LANGUAGES = {
    'ar': 'Arabic',
    'zh-cn': 'Chinese Simplified',
    'zh-tw': 'Chinese Traditional',
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'hi': 'Hindi',
    'id': 'Indonesian',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ms': 'Malay',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'es': 'Spanish',
    'th': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'vi': 'Vietnamese',
    'nl': 'Dutch',
    'pl': 'Polish',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text to a specified language')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('The language to translate to')
                .setRequired(true)
                .addChoices(...Object.entries(LANGUAGES).map(([code, name]) => ({ name, value: code }))))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The text to translate')
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

        const targetLang = interaction.options.getString('language');
        const textToTranslate = interaction.options.getString('text');

        try {
            const result = await translate(textToTranslate, { to: targetLang });

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Translation')
                .addFields(
                    { name: 'Original Text', value: textToTranslate },
                    { name: `Translated to ${LANGUAGES[targetLang]}`, value: result.text }
                )
                .setThumbnail(botAvatarURL)
                .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Translation error:', error);
            await interaction.editReply('Sorry, there was an error translating your text. Please try again later.');
        }
    },
};
