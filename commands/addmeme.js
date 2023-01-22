const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const fs = require('fs');

// Read from JSON files
let memes;
try {
    memes = JSON.parse(fs.readFileSync("./memes.json", "utf8"));
} catch (err) {
    console.log(err);
}

module.exports = {
    name: 'addmeme',
    description: 'Adds a meme to the memes.json file',
    execute(message, args) {
        // Only run if user is admin
        if (message.member.permissions.has('ADMINISTRATOR')) {
            if (!args[0]) {
                // If not args provided, inform user
                console.log('<AddMeme> No URL added to command');
                message.reply('You need to enter a URL to a meme');
                return;
            } else if (!args[0].includes('https://') && !args[0].includes('http://')) {
                // If no link provided, inform user
                console.log('<AddMeme> No valid URL detected on command');
                message.reply('Provide a valid URL');
                return;
            } else {
                var lastKey = Object.keys(memes).pop();  // Get the last key

                if (!lastKey) {
                    lastKey = '0'; // Set last key to 0 if one doesn't exist
                }

                var newKey = (parseInt(lastKey) + 1); // Add one onto the last in the list

                // Add meme to memes.json
                if (!memes[newKey]) memes[newKey] = {
                    url: args[0]
                };

                // Write to the file
                fs.writeFileSync('./memes.json', JSON.stringify(memes), (err) => {
                    if (err) console.error(err);
                });

                const memeLibraryCh = message.guild.channels.cache.find(channel => channel.name === 'meme-library');

                message.reply(`Meme #${newKey} added.`);
                console.log('<AddMeme> Added meme #${newKey} to memes.json');
                memeLibraryCh.send(`Meme #${newKey}: ` + args[0]);
                return;
            }
        }
    }
};