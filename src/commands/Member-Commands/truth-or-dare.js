const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const isChannelLocked = config.CommandChannelLocked;
const allowedChannelId = config.CommandChannelId;
// 90 SFW Truths
const truths = [
    "What's the most embarrassing song you have on your playlist?",
    "If you could trade lives with someone for a day, who would it be?",
    "What's the silliest thing you've ever done at work?",
    "If you could have dinner with any historical figure, who would it be?",
    "What's your most useless talent?",
    "If you could instantly become an expert in one subject, what would it be?",
    "What's the strangest dream you've ever had?",
    "If you could change your name, what would you change it to?",
    "What's the most unusual food you've ever eaten?",
    "If you could live in any fictional world, which one would you choose?",
    "What's your favorite childhood memory?",
    "If you could have any superpower, what would it be?",
    "What's the most embarrassing thing you've ever worn?",
    "If you could be any age for a week, what age would you choose?",
    "What's the worst haircut you've ever had?",
    "If you could be invisible for a day, what would you do?",
    "What's the most ridiculous fact you know?",
    "If you had to eat one food for the rest of your life, what would it be?",
    "What's the worst gift you've ever received?",
    "If you could switch lives with anyone in the room, who would it be?",
    "What's your guilty pleasure TV show?",
    "If you could instantly learn any language, which would you choose?",
    "What's the most embarrassing thing you've ever said to a crush?",
    "If you could have dinner with any fictional character, who would it be?",
    "What's the weirdest thing you've ever eaten?",
    "If you could travel anywhere in the world right now, where would you go?",
    "What's your most irrational fear?",
    "If you could be any animal for a day, what would you be?",
    "What's the most childish thing you still do?",
    "If you could change one thing about yourself, what would it be?",
    "What's the most embarrassing thing in your room right now?",
    "If you could be in any movie, which one would you choose?",
    "What's the worst advice you've ever given?",
    "If you could have a lifetime supply of one food, what would it be?",
    "What's your most embarrassing childhood memory?",
    "If you could swap lives with any celebrity for a day, who would it be?",
    "What's the strangest thing you've ever bought?",
    "If you could relive one day of your life, which would it be?",
    "What's the most embarrassing thing you've ever done in public?",
    "If you could have any job in the world, what would it be?",
    "What's your biggest pet peeve?",
    "If you could meet any historical figure, who would it be?",
    "What's the worst fashion trend you've ever followed?",
    "If you could instantly master any skill, what would it be?",
    "What's the most embarrassing thing your parents have caught you doing?",
    "If you could be any fictional character, who would you be?",
    "What's the strangest dream you've ever had?",
    "If you could change one thing about your appearance, what would it be?",
    "What's the most embarrassing nickname you've ever had?",
    "If you could live in any time period, which would you choose?",
    "What's the worst job you've ever had?",
    "If you could have any animal as a pet, what would it be?",
    "What's the most embarrassing thing you've ever posted online?",
    "If you could be famous for one thing, what would it be?",
    "What's the weirdest food combination you enjoy?",
    "If you could have any question answered, what would it be?",
    "What's the most embarrassing thing you've ever worn to school or work?",
    "If you could have any view from your window, what would it be?",
    "What's the strangest thing you've ever done for money?",
    "If you could be any character in a book, who would you be?",
    "What's the most embarrassing thing you've ever said to a teacher?",
    "If you could have any job in the world for one day, what would it be?",
    "What's the worst trouble you've ever been in?",
    "If you could have any famous person as your sibling, who would it be?",
    "What's the most embarrassing thing you've ever done on a date?",
    "If you could be any age for a year, what age would you choose?",
    "What's the strangest thing you've ever seen in someone else's home?",
    "If you could have any talent instantly, what would it be?",
    "What's the most embarrassing thing you've ever done in front of a crowd?",
    "If you could switch lives with anyone for a day, who would it be?",
    "What's the worst lie you've ever told?",
    "If you could have any job in the world, regardless of qualifications, what would it be?",
    "What's the most embarrassing thing you've ever bought?",
    "If you could be any fictional villain, who would you be?",
    "What's the strangest thing you've ever eaten on a dare?",
    "If you could have any famous person as your parent, who would it be?",
    "What's the most embarrassing thing you've ever done at a party?",
    "If you could instantly become an expert in one subject, what would it be?",
    "What's the worst date you've ever been on?",
    "If you could have any superpower for a day, what would it be?",
    "What's the most embarrassing thing you've ever done in front of your crush?",
    "If you could live anywhere in the world, where would it be?",
    "What's the strangest thing you've ever found?",
    "If you could be any cartoon character, who would you be?",
    "What's the most embarrassing thing you've ever worn in public?",
    "If you could have dinner with any three people, living or dead, who would they be?",
    "What's the worst gift you've ever given someone?",
    "If you could change one thing about your personality, what would it be?",
    "What's the most embarrassing thing you've ever done at work or school?",
    "If you could be any mythical creature, what would you be?",
    "What's the strangest thing you believed as a child?",
];

// 90 SFW Dares
const dares = [
    "Do your best impression of a celebrity for 30 seconds.",
    "Sing the chorus of your favorite song right now.",
    "Tell a joke. If no one laughs, you have to tell another one.",
    "Do your best robot dance for 20 seconds.",
    "Speak in an accent of your choice for the next 3 minutes.",
    "Draw a self-portrait with your non-dominant hand and share it.",
    "Make up a short jingle about the person to your left (or the last person who spoke in chat).",
    "Act out your favorite movie scene without using any words.",
    "Try to lick your elbow for 10 seconds.",
    "Do your best impression of a news anchor reporting on the weather.",
    "Recite the alphabet backwards as fast as you can.",
    "Do your best impression of a famous YouTuber.",
    "Speak in rhymes for the next 2 minutes.",
    "Do 10 jumping jacks right now.",
    "Make up a rap about your day so far.",
    "Tell a story using only emojis in the chat.",
    "Do your best impression of a robot learning to be human.",
    "Sing 'Happy Birthday' in a whisper.",
    "Try to do a handstand (or a headstand if you prefer) for 5 seconds.",
    "Speak without moving your lips for 30 seconds.",
    "Do your best impression of a cat waking up from a nap.",
    "Try to write your name with your foot (if in person) or with your eyes closed (if online).",
    "Make up a short song about the last meal you ate.",
    "Do your best impression of a sports commentator for 30 seconds.",
    "Try to say the tongue twister 'She sells seashells by the seashore' 3 times fast.",
    "Do your best impression of a character from your favorite TV show.",
    "Attempt to juggle with 3 items for 15 seconds.",
    "Make up a haiku about your favorite food.",
    "Do your best impression of a mime stuck in a box.",
    "Try to balance a spoon on your nose for 10 seconds.",
    "Speak in slow motion for 1 minute.",
    "Do your best impression of a surfer dude or valley girl.",
    "Try to say the alphabet with a piece of food in your mouth (if in person) or while holding your tongue (if online).",
    "Make up a short commercial for a random object near you.",
    "Do your best impression of a chicken laying an egg.",
    "Try to draw a perfect circle freehand and show everyone.",
    "Speak like Yoda for the next 2 minutes, you must.",
    "Do your best impression of a penguin walking on ice.",
    "Make up a short story using the last 5 words you texted or typed.",
    "Do your best impression of someone in slow motion.",
    "Try to say 'unique New York' 5 times fast.",
    "Do your best impression of a TV shopping channel host.",
    "Make up a short poem about the color blue.",
    "Do your best impression of a tree swaying in the wind.",
    "Try to write your name backwards in cursive.",
    "Speak like a pirate for the next 3 minutes.",
    "Do your best impression of a person stuck in quicksand.",
    "Make up a short song about your favorite hobby.",
    "Try to touch your nose with your tongue. If you can't, you must attempt it for 15 seconds.",
    "Do your best impression of a grumpy old person.",
    "Attempt to do 5 push-ups (or 5 wall push-ups if you prefer).",
    "Make up a new dance move and name it.",
    "Do your best impression of a chef hosting a cooking show.",
    "Try to say 'Peter Piper picked a peck of pickled peppers' 3 times fast.",
    "Speak in alliteration for the next 2 minutes (each sentence should have words that start with the same letter).",
    "Do your best impression of a superhero landing.",
    "Make up a short jingle for a made-up product.",
    "Try to do the 'floss' dance for 15 seconds.",
    "Do your best impression of a movie trailer voice-over artist.",
    "Attempt to spin in a circle 5 times and then walk in a straight line.",
    "Make up a short rap about your favorite animal.",
    "Do your best impression of a person walking on the moon.",
    "Try to say the days of the week backwards as fast as you can.",
    "Speak like a cowboy/cowgirl for the next 3 minutes.",
    "Do your best impression of a fashion model on a runway.",
    "Make up a short story using only questions.",
    "Try to do the 'dab' in slow motion.",
    "Do your best impression of a radio DJ introducing a song.",
    "Attempt to do 10 star jumps.",
    "Make up a short speech accepting an Oscar for 'Best Dancer'.",
    "Do your best impression of a person trying to walk against strong wind.",
    "Try to say 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?' 3 times fast.",
    "Speak in opposites for the next 2 minutes (say the opposite of what you mean).",
    "Do your best impression of a person at a rock concert.",
    "Make up a short song about your favorite season.",
    "Try to do the 'macarena' dance without music.",
    "Do your best impression of a person trying to catch a fly.",
    "Attempt to recite the 'To be or not to be' soliloquy from Hamlet (or as much as you can remember).",
    "Make up a short story about the last thing you ate coming to life.",
    "Do your best impression of a person trying to walk in flippers.",
    "Try to say the months of the year in alphabetical order.",
    "Speak like you're underwater for the next 2 minutes.",
    "Do your best impression of a person trying to open a very tight jar.",
    "Make up a short song about your favorite movie.",
    "Try to do the 'robot' dance for 15 seconds.",
    "Do your best impression of a person giving a very boring lecture.",
    "Attempt to recite a nursery rhyme in a dramatic, Shakespearean style.",
    "Make up a short rap about the room you're in (or your current surroundings if online).",
    "Do your best impression of a person trying to walk on a tightrope.",
    "Try to say 'Sally sells seashells by the seashore' 5 times fast.",
    "Speak in a whisper for the next 3 minutes.",
];

// The rest of the code remains the same as in the previous example


module.exports = {
    data: new SlashCommandBuilder()
        .setName('truthordare')
        .setDescription('Play a safe-for-work version of Truth or Dare!'),
    async execute(interaction) {
        if (isChannelLocked && interaction.channelId !== allowedChannelId) {
            return interaction.reply({ 
                content: `This command can only be used in the designated channel <#${allowedChannelId}>. `, 
                ephemeral: true 
            });
        }
  const botAvatarURL = interaction.client.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('Truth or Dare')
            .setDescription('Choose Truth, Dare, or Skip to the next player!')
            .setThumbnail(botAvatarURL)
            .setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
            .setTimestamp();
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('truth')
                    .setLabel('Truth')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dare')
                    .setLabel('Dare')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary),
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => ['truth', 'dare', 'skip'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'truth') {
                const truth = truths[Math.floor(Math.random() * truths.length)];
                embed.setDescription(`Truth: ${truth}`);
                await i.update({ embeds: [embed], components: [] });
            } else if (i.customId === 'dare') {
                const dare = dares[Math.floor(Math.random() * dares.length)];
                embed.setDescription(`Dare: ${dare}`);
                await i.update({ embeds: [embed], components: [] });
            } else if (i.customId === 'skip') {
                embed.setDescription('Skipped! Use the command again for the next player.');
                await i.update({ embeds: [embed], components: [] });
            }
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                embed.setDescription('No selection was made. Try again!');
                embed.setThumbnail(botAvatarURL)
                embed.setFooter({ text: `used by ${interaction.user.tag}`, iconURL: botAvatarURL })
                embed.setTimestamp();
                interaction.editReply({ embeds: [embed], components: [] });
            }
        });
    },
};
