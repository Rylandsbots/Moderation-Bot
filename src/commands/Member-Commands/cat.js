const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cutecat')
    .setDescription('Generate a cute cat image!'),
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
      // Rest of the code remains the same
      const response = await axios.get('https://api.thecatapi.com/v1/images/search');
      const imageUrl = response.data[0].url;

      const catEmojis = ['🐱', '😺', '😸', '😻', '🐈', '🐾', '🙀', '😽'];
      const randomEmoji = catEmojis[Math.floor(Math.random() * catEmojis.length)];

      const phrases = [
        "Meow-velous! Here's your cute cat!",
        "Paw-some cuteness coming right up!",
        "Get ready for some fur-midable adorableness!",
        "Cat-ch this cuteness if you can!",
        "Prepare for a purr-fect dose of cuteness!",
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

      const catFacts = [
        "Cats spend 70% of their lives sleeping.",
        "A group of cats is called a 'clowder'.",
        "Cats can rotate their ears 180 degrees.",
        "A cat's nose print is unique, like a human's fingerprint.",
        "Cats can jump up to six times their length.",
      ];
      const randomFact = catFacts[Math.floor(Math.random() * catFacts.length)];

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`${randomEmoji} Cute Cat Generator ${randomEmoji}`)
        .setDescription(randomPhrase)
        .setImage(imageUrl)
        .addFields({ name: 'Cat Fact', value: randomFact })
        .setThumbnail(botAvatarURL)
        .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching cute cat image:', error);
      await interaction.editReply('Oops! The cute cats are taking a catnap. Please try again later!');
    }
  },
};
