module.exports = {
    name: 'meme',
    description: 'Sends a random meme from memes.json',
    cooldown: 0,
    execute(message) {
        const fs = require('fs')
        let memes

        try {
            memes = JSON.parse(fs.readFileSync("./memes.json", "utf8"));
        } catch (err) {
            console.log(err);
        }

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
                var url = matchedKey['url'] // Get the url for the matched random number

                // Send the url back to the channel where the !meme command was found
                message.channel.send(url);
            }
        })
    },
};