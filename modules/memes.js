// Define fs
const fs = require('fs');

function hasNumber(input) {
    return /\d/.test(input);
}

function memeFunction(message) {
    if (!message.content.startsWith('!meme') || message.author.bot) return;

    // Read from JSON
    let memes
    try {
        memes = JSON.parse(fs.readFileSync("./memes.json", "utf8"));
    } catch (err) {
        console.log(err);
    }

    if (hasNumber(message.content)) {
        // If the command has a number (i.e. !meme 45)
        // Read the file
        fs.readFile('./memes.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Set the number to that of the input
                var fixedNo = message.content.replace(/\s+/g, '').slice(5) // Replace spaces with nothing and trim !meme
                var matchedKey = memes[fixedNo]

                if (!matchedKey) {
                    // If no match on number, tell user
                    console.log('No meme with that ID exists')
                    message.reply('no meme with that ID exists.');
                    return
                }
                var url = matchedKey['url'] // Get the url for the matched random number

                console.log('Meme #' + fixedNo + ' sent to chat. (Fixed value)')
                // Send the ID and url back to the channel where the !meme command was found
                message.channel.send(`Meme #${fixedNo}: ${url}`);
            }
        })
    } else {
        // If no number provided
        // Function to get a random number between 1 and the max provided
        function getRandomInt(max) {
            return Math.floor(Math.random() * max + 1);
        }

        // Read the file
        fs.readFile('./memes.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Pick a random number between 0 and the array length + 1
                var randomNo = getRandomInt(Object.keys(memes).length)
                var matchedKey = memes[randomNo]

                if (!matchedKey) {
                    // Tell user no memes added if the file is empty
                    console.log('No memes added')
                    message.reply('no memes have been added yet. Use the !addmeme command to add some.');
                    return
                }
                var url = matchedKey['url'] // Get the url for the matched random number

                console.log('Meme #' + randomNo + ' sent to chat.')
                // Send the ID and url back to the channel where the !meme command was found
                message.channel.send(`Meme #${randomNo}: ${url}`);
            }
        })
    }
}

module.exports.memeFunction = memeFunction;
