const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'src', 'databases', 'voice_channels.json');

const config = require('../settings.js');

let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!Array.isArray(db)) {
    db = [];
  }
} catch (error) {
  console.error('Error reading database file:', error);
  db = [];
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    let createVcCategory;
    let createVcChannel;

    const guild = client.guilds.cache.first();
    if (guild) {
      // Create or find the "Create A VC" category
      createVcCategory = guild.channels.cache.find(channel => channel.name === "Create A VC" && channel.type === 4);
      if (!createVcCategory) {
        createVcCategory = await guild.channels.create({
          name: "Create A VC",
          type: 4,
        });
      }

      // Create or find the "Create A VC" channel within the category
      createVcChannel = guild.channels.cache.find(channel => channel.name === "Create A VC" && channel.type === 2 && channel.parentId === createVcCategory.id);
      if (!createVcChannel) {
        createVcChannel = await guild.channels.create({
          name: "Create A VC",
          type: 2,
          parent: createVcCategory.id,
        });
      }
    }

    client.on('voiceStateUpdate', async (oldState, newState) => {
      const { guild, member } = newState;

      if (newState.channelId === createVcChannel.id && oldState.channelId !== newState.channelId) {
        try {
          const existingChannel = db.find(c => c.owner_id === member.user.id);

          if (existingChannel) {
            await member.voice.setChannel(existingChannel.channel_id);
          } else {
            const newChannel = await guild.channels.create({
              name: `${member.user.username}'s Channel`,
              type: 2,
              parent: createVcCategory.id,
            });
            await member.voice.setChannel(newChannel);

            db.push({
              channel_id: newChannel.id,
              guild_id: guild.id,
              owner_id: member.user.id,
            });
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
          }
        } catch (error) {
          console.error('Error creating voice channel:', error);
        }
      }

      if (oldState.channelId && !newState.channelId) {
        const oldChannelId = oldState.channelId;
        const oldChannel = oldState.guild.channels.cache.get(oldChannelId);
        if (oldChannel && oldChannel.members.size === 0 && oldChannel.id !== createVcChannel.id) {
          const index = db.findIndex(c => c.channel_id === oldChannelId);
          if (index !== -1) {
            oldChannel.delete();
            db.splice(index, 1);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
          }
        }
      }
    });
  },
};
