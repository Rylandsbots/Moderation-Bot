const fs = require('fs');
const path = require('path');

const dbRoleMenu = path.join(__dirname, '..', 'databases', 'rolemenus.json');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    console.log('Reaction removed');

    // Partial reactions need to be fetched
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Something went wrong when fetching the message:', error);
        return;
      }
    }

    // Don't proceed if the user is a bot
    if (user.bot) return;

    let emojiIdentifier;
    if (reaction.emoji.id) {
      // This is a custom emoji
      emojiIdentifier = reaction.emoji.id;
    } else {
      // This is a unicode emoji
      emojiIdentifier = reaction.emoji.name;
    }

    console.log(`Reaction removed: ${emojiIdentifier}, User: ${user.tag}`);

    // Read the role menus from the database
    let rolemenus = [];
    try {
      const data = fs.readFileSync(dbRoleMenu, 'utf8');
      rolemenus = JSON.parse(data);
      console.log('Role menus loaded:', rolemenus);
    } catch (error) {
      console.error('Error reading role menu database:', error);
      return;
    }

    // Find the role menu for this message
    const roleMenu = rolemenus.find(menu => menu.messageId === reaction.message.id);
    if (!roleMenu) {
      console.log('No role menu found for this message');
      return;
    }

    console.log('Role menu found:', roleMenu);

    // Find the role that corresponds to this reaction
    const roleData = roleMenu.roles.find(role => role.emoji === emojiIdentifier);
    if (!roleData) {
      console.log('No role found for this emoji');
      console.log('Available emojis:', roleMenu.roles.map(r => r.emoji));
      return;
    }

    console.log(`Role found: ${roleData.name}, ID: ${roleData.id}`);

    // Get the guild member
    const member = await reaction.message.guild.members.fetch(user.id);

    // Remove the role using the role ID from the database
    try {
      await member.roles.remove(roleData.id);
      console.log(`Role ${roleData.name} (ID: ${roleData.id}) removed from ${user.tag}`);
      user.send(`The role ${roleData.name} has been removed from you.`).catch(() => {
        console.log(`Couldn't send DM to ${user.tag}`);
      });
    } catch (error) {
      console.error('Failed to remove role:', error);
      user.send('There was an error while trying to remove the role. Please contact an administrator.').catch(() => {
        console.log(`Couldn't send error DM to ${user.tag}`);
      });
    }
  },
};
