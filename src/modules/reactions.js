const fs = require('fs').promises;
const path = require('path');

async function reactFunction(message) {
    // Ignore bots immediately to save resources
    if (message.author.bot) return;

    const reactsPath = path.join(__dirname, '../json/reacts.json');

    let reacts;
    try {
        const data = await fs.readFile(reactsPath, 'utf8');
        reacts = JSON.parse(data);
    } catch (err) {
        return console.error(`<Reactions> Error reading DB: ${err.message}`);
    }

    // Convert message to lower case once
    const msgContentLower = message.content.toLowerCase();
    const keys = Object.keys(reacts);

    for (const key of keys) {
        const keyLower = key.toLowerCase();

        // Check if message contains the keyword
        if (!msgContentLower.includes(keyLower)) continue;

        const { reply, caseSensitivity, usedAnywhere } = reacts[key];

        // Logic checks
        const exactPhrase = msgContentLower === keyLower; // Exact match ignoring case
        const exactCase = message.content.includes(key);  // Exact match including case

        let shouldReply = false;

        if (caseSensitivity === 1) {
            // Case matters: must match casing
            if (exactCase) {
                if (usedAnywhere === 1) shouldReply = true;
                else if (exactPhrase) shouldReply = true; // Implicitly true if exactCase is true and strings are equal length, but keeping logic clear
            }
        } else {
            // Case doesn't matter
            if (usedAnywhere === 1) shouldReply = true;
            else if (exactPhrase) shouldReply = true;
        }

        if (shouldReply) {
            console.log(`<Reactions> Triggered by "${key}". Replying.`);
            try {
                await message.channel.send(reply);
            } catch (e) {
                console.error(`<Reactions> Failed to send reply: ${e.message}`);
            }
            // Stop after one match? Remove break if we want multiple reactions per message
            return;
        }
    }
}

module.exports.reactFunction = reactFunction;