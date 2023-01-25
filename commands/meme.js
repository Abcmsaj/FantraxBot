const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Function to get a random number between 1 and the max provided
function getRandomInt(max) {
    return Math.floor(Math.random() * max + 1);
}

module.exports = {
    name: 'meme',
    description: 'Sends a meme to the chat',
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Sends a random meme to the chat, or a specific one if a value is provided')
        .addNumberOption((option) => option
            .setName('number')
            .setDescription('The number of meme you want to send (optional)')
            .setRequired(false)),
    cooldown: 10,
    async execute(interaction) {
        // Read from JSON
        let memes;
        try {
            memes = JSON.parse(fs.readFileSync("./memes.json", "utf8"));
        } catch (err) {
            console.error(err);
        }

        const memenumber = interaction.options.getNumber('number');

        if (memenumber) {
            // If the command has a number (i.e. /meme 45)
            // Read the file
            fs.readFile('./memes.json', (err) => {
                if (err) {
                    throw err;
                } else {
                    // Look up the meme in the json file
                    var matchedKey = memes[memenumber];

                    if (!matchedKey) {
                        // If no match on number, tell user
                        console.log(`<Memes> No meme with ID ${memenumber} exists`);
                        interaction.reply('No meme with that ID exists.');
                        return;
                    }
                    var url = matchedKey['url']; // Get the url for the matched random number

                    console.log(`<Memes> Meme #${memenumber} requested by ${interaction.user.username} and sent to #${interaction.channel.name} (Fixed number)`);
                    // Send the ID and url back to the channel where the !meme command was found
                    interaction.reply(`Meme #${memenumber}: ${url}`);
                }
            });
        } else {
            // If no number provided
            // Read the file
            fs.readFile('./memes.json', (err) => {
                if (err) {
                    throw err;
                } else {
                    // Pick a random number between 0 and the array length + 1
                    var randomNo = getRandomInt(Object.keys(memes).length);
                    var matchedKey = memes[randomNo];

                    if (!matchedKey) {
                        // Tell user no memes added if the file is empty
                        console.log('<Memes> No memes added');
                        message.reply('no memes have been added yet. Use the !addmeme command to add some.');
                        return;
                    }
                    var url = matchedKey['url']; // Get the url for the matched random number

                    console.log(`<Memes> Meme #${randomNo} requested by ${interaction.user.username} and sent to #${interaction.channel.name} (Random)`);
                    // Send the ID and url back to the channel where the !meme command was found
                    interaction.reply(`Meme #${randomNo}: ${url}`);
                }
            });
        }
    },
};