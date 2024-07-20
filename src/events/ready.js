const Discord = require('discord.js');
const config = require('../settings.js');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(config.botstartmessage);
        try {
            const botUser = await client.users.fetch(client.user.id);
            console.log('\x1b[38;5;208m%s\x1b[0m', 'This bot has been developed by the team at Phoenix Innovations and is completely free to use and modify, as it is open-source for the coding community.');
            console.log('\x1b[34m%s\x1b[0m', 'Developers: Ryland, Timmy, Qub');
            console.log('\x1b[32m%s\x1b[0m', 'The bot is currently online and operational. If you need support, please visit our Discord channel: https://discord.gg/rGg7Q5xrdB.');
            console.log('\x1b[32mLogged In As (' + botUser.username + ')\x1b[0m');


            // Display guilds
            client.guilds.cache.forEach(guild => {
                console.log(`\x1b[35mGuild: ${guild.name} - ${guild.id}\x1b[0m`);


                
                // Find the role with the same name as the bot
                const botRole = guild.roles.cache.find(role => role.name === botUser.username);
                if (botRole) {
                    console.log('\x1b[35mBot Perms "%s" permissions: %s \n\x1b[35m❤️  Thank you for choosing Phoenix Innovations.\x1b[0m', botRole.name, botRole.permissions.toArray().join(', '));

                } else {
                    console.log(`'\x1b[32m%s\x1b[0m', 'Role with the name "${botUser.username}" not found in ${guild.name}`);
                   

                }
            });

        } catch (error) {
            console.error('Error fetching bot username:', error);
        }
    },
};
