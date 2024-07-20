const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../settings.js');

const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calculator')
    .setDescription('Perform basic math operations')
    .addNumberOption(option =>
      option.setName('first')
        .setDescription('The first number')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('operation')
        .setDescription('The operation to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Addition (+)', value: '+' },
          { name: 'Subtraction (-)', value: '-' },
          { name: 'Multiplication (*)', value: '*' },
          { name: 'Division (/)', value: '/' }
        ))
    .addNumberOption(option =>
      option.setName('second')
        .setDescription('The second number')
        .setRequired(true)),

  async execute(interaction) {
    if (isChannelLocked && interaction.channelId !== allowedChannelId) {
      return interaction.reply({ 
        content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
        ephemeral: true 
      });
    }

    const botAvatarURL = interaction.client.user.displayAvatarURL();
    const first = interaction.options.getNumber('first');
    const operation = interaction.options.getString('operation');
    const second = interaction.options.getNumber('second');

    let result;
    let symbol;

    switch (operation) {
      case '+':
        result = first + second;
        symbol = '+';
        break;
      case '-':
        result = first - second;
        symbol = '-';
        break;
      case '*':
        result = first * second;
        symbol = '×';
        break;
      case '/':
        if (second === 0) {
          return interaction.reply('Error: Division by zero is not allowed.');
        }
        result = first / second;
        symbol = '÷';
        break;
    }

    const embed = new EmbedBuilder()
      .setColor('#0000FF')
      .setTitle('Calculator Result')
      .setDescription(`${first} ${symbol} ${second} = **${result}**`)
      .setThumbnail(botAvatarURL)
      .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
