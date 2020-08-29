// Define fs
const fs = require('fs');

// Read from JSON files
const ssn = JSON.parse(fs.readFileSync("./ssn.json", "utf8"));

function ssnTrackerFunction(reaction) {
    // ----------------
    // SSN Counter
    // ----------------

    if (reaction.emoji.name === 'ssn') {
        // Only trigger this if statement if the SSN is the FIRST given - don't count duplicates
        // Also don't trigger if someone SSN a bot
        if (reaction.count === 1 && !reaction.message.author.bot) {
            // If this was the first time that a red card was given then follow this route
            console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a SSN!`);

            // Add user data to ssn.json if they don't exist
            if (!ssn[reaction.message.author.id]) ssn[reaction.message.author.id] = {
                username: reaction.message.author.username,
                SSN: 0
            };

            // Increment the value of SSN and write to the JSON file
            const ssnData = ssn[reaction.message.author.id];
            ssnData.SSN++;
            console.log(ssnData);
            fs.writeFileSync('./ssn.json', JSON.stringify(ssn), (err) => {
                if (err) console.error(err);
            });
        } else if (reaction.message.author.bot) {
            console.log(`Not registering SSN as it was added to a bot`);
        } else {
            console.log(`SSN count is ${reaction.count} - no need to track again`);
        }
    } else {
        return 0;
    }
}

module.exports.ssnTrackerFunction = ssnTrackerFunction;