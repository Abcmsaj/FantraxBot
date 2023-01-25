const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

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
    data: new SlashCommandBuilder()
        .setName('addmeme')
        .setDescription('Adds a meme (URL) to the JSON file')
        .addStringOption((option) => option
            .setName('url')
            .setDescription('The URL of the image')
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        const url = interaction.options.getString('url');

        if (!url.includes('https://') && !url.includes('http://')) {
            // If no link provided, inform user
            console.log('<AddMeme> No valid URL detected on command');
            interaction.reply('Provide a valid URL');
            return;
        } else {
            var lastKey = Object.keys(memes).pop();  // Get the last key
            console.log('1');
            if (!lastKey) {
                lastKey = '0'; // Set last key to 0 if one doesn't exist
            }
            console.log('2');
            var newKey = (parseInt(lastKey) + 1); // Add one onto the last in the list
            console.log('3');
            // Add meme to memes.json
            if (!memes[newKey]) memes[newKey] = {
                url: url
            };
            console.log('4');
            // Write to the file
            fs.writeFileSync('./memes.json', JSON.stringify(memes), (err) => {
                if (err) console.error(err);
            });

            const memeLibraryCh = interaction.guild.channels.cache.find(channel => channel.name === 'meme-library');

            interaction.reply(`Meme #${newKey} added.`);
            console.log(`<AddMeme> Added meme #${newKey} to memes.json`);
            memeLibraryCh.send(`Meme #${newKey}: ` + url);
            return;
        }
    }
};