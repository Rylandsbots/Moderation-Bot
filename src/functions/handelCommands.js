const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../settings.js'); // Import your configuration file

const clientId = config.clientid;
const guildId = config.guildid;

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];

        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        console.log(`Loaded ${client.commandArray.length} command(s).`);

        const rest = new REST({
            version: '9'
        }).setToken(config.token);

        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(clientId), {
                    body: client.commandArray
                },
            );

            console.log('Successfully reloaded application (/) commands.');

            // Wait for the bot to be ready before starting the status updates
            client.on('ready', () => {
                console.log(`Logged in as ${client.user.tag}!`);
                updateBotStatusEmbed(client);
            });

        } catch (error) {
            console.error('Error refreshing commands:', error);
        }
    };
};

function updateBotStatusEmbed(client) {
    sendBotStatusEmbed(client);
    setInterval(() => sendBotStatusEmbed(client), 60000); // Update every 60 seconds
}

async function sendBotStatusEmbed(client) {
    try {
  
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`Couldn't find guild with ID ${guildId}`);
            return;
        }

        let botPanelChannel = guild.channels.cache.find(channel => channel.name === 'bot-panel');
        let isNewChannel = false;
        
        if (!botPanelChannel) {
            botPanelChannel = await guild.channels.create({
                name: 'bot-panel',
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
                    },
                    {
                        id: guild.ownerId,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            });
            isNewChannel = true;
        }

        // Send message to server owner if it's a new channel
        if (isNewChannel) {
            try {
                const owner = await guild.fetchOwner();
                await botPanelChannel.send(`${owner} I've created this channel for bot status updates. Please move it to where you want it in the server. Do not rename the channel.`);
            } catch (error) {
                console.error("Failed to ping server owner in the new channel:", error);
            }
        }

        const commandsList = client.commandArray.map(cmd => `✅ ${cmd.name}`).join('\n');

        // Get bot permissions
        const botMember = await guild.members.fetch(client.user.id);
        const permissions = botMember.permissions.toArray();
        const permissionsList = permissions.join(', ');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Bot Status')
            .addFields(
                { name: 'Commands Loaded', value: `Total: ${client.commandArray.length}\n\`\`\`${commandsList}\`\`\`` },
                { name: 'Bot Permissions', value: `\`\`\`${permissionsList}\`\`\`` },
                { name: 'Bot Ping', value: `${client.ws.ping}ms` },
                { name: 'Uptime', value: formatUptime(client.uptime) },
                { name: 'Client ID', value: clientId },
                { name: 'Guild', value: guild.name }
            )
            .setTimestamp();

        const messages = await botPanelChannel.messages.fetch({ limit: 1 });
        const lastMessage = messages.first();

        if (lastMessage && lastMessage.author.id === client.user.id && !isNewChannel) {
            await lastMessage.edit({ embeds: [embed] });
        } else {
            await botPanelChannel.send({ embeds: [embed] });
        }

  

    } catch (error) {
        console.error('Error updating bot status embed:', error);
    }
}

function formatUptime(uptime) {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
