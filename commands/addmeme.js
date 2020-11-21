const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
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
        if (message.member.hasPermission('ADMINISTRATOR')) {
            if (!args[0]) {
                // If not args provided, inform user
                message.reply('you need to enter a URL to a meme');
                return;
            } else if (!args[0].includes('https://') && !args[0].includes('http://')) {
                // If no link provided, inform user
                message.reply('provide a valid URL');
                return;
            } else {
                var lastKey = Object.keys(memes).pop()  // Get the last key

                if (!lastKey) {
                    lastKey = '0' // Set last key to 0 if one doesn't exist
                }

                var newKey = (parseInt(lastKey) + 1) // Add one onto the last in the list

                console.log(lastKey)
                console.log(newKey)

                // Add meme to memes.json
                if (!memes[newKey]) memes[newKey] = {
                    url: args[0]
                };

                // Write to the file
                fs.writeFileSync('./memes.json', JSON.stringify(memes), (err) => {
                    if (err) console.error(err);
                });

                message.reply(`meme #${newKey} added.`)
                console.log('Added meme to memes.json');
                return;
            }
        }
    }
};