const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cutedog')
    .setDescription('Generate a cute dog image!'),
  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    await interaction.deferReply();

    try {
      const response = await axios.get('https://api.thedogapi.com/v1/images/search');
      const imageUrl = response.data[0].url;

      const dogEmojis = ['🐶', '🐕', '🦮', '🐩', '🐾', '🦴', '🐺', '🐕‍🦺'];
      const randomEmoji = dogEmojis[Math.floor(Math.random() * dogEmojis.length)];

      const phrases = [
        "Woof-tastic! Here's your cute dog!",
        "Paw-some cuteness coming right up!",
        "Get ready for some bark-tacular adorableness!",
        "Fetch this cuteness if you can!",
        "Prepare for a bow-wow dose of cuteness!",
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

      const dogFacts = [
        "A dog's nose print is unique, much like a human's fingerprint.",
        "Dogs have about 1,700 taste buds. Humans have approximately 9,000.",
        "The Basenji is the world's only barkless dog.",
        "A dog's sense of smell is 10,000 to 100,000 times stronger than humans.",
        "Greyhounds can reach speeds of up to 45 miles per hour.",
      ];
      const randomFact = dogFacts[Math.floor(Math.random() * dogFacts.length)];

      const embed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle(`${randomEmoji} Cute Dog Generator ${randomEmoji}`)
        .setDescription(randomPhrase)
        .setImage(imageUrl)
        .addFields({ name: 'Dog Fact', value: randomFact })
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching cute dog image:', error);
      await interaction.editReply('Oops! The cute dogs are taking a nap. Please try again later!');
    }
  },
};
