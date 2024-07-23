const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, Collection, Events, InteractionType, Partials } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const config = require('./settings.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildInvites,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ]
});

client.commands = new Collection();


// Load functions
const functions = fs.readdirSync('./src/functions').filter(file => file.endsWith('.js'));
for (const file of functions) {
    require(`./functions/${file}`)(client);
}

// Load events
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
client.handleEvents(eventFiles, './src/events');

// Load commands
const commandFolders = fs.readdirSync('./src/commands');
client.handleCommands(commandFolders, './src/commands');

client.invites = new Collection();
client.login(config.token);
