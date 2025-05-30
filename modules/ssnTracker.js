// Define fs
const fs = require('fs');

// Read from JSON files
let ssn;
try {
    ssn = JSON.parse(fs.readFileSync("./json/ssn.json", "utf8"));
} catch (err) {
    console.error(err);
}

let ssnGiver;
try {
    ssnGiver = JSON.parse(fs.readFileSync("./json/ssnGiver.json", "utf8"));
} catch (err) {
    console.error(err);
}

function ssnTrackerFunction(reaction, user) {
    // ----------------
    // SSN Counter
    // ----------------

    if (reaction.emoji.name === 'ssn') {
        // Only trigger this if statement if the SSN is the FIRST given - don't count duplicates
        // Also don't trigger if someone SSN a bot
        if (reaction.count === 1 && !reaction.message.author.bot) {
            // If this was the first time that a red card was given then follow this route
            console.log(`<SSNTracker> ${reaction.message.author.tag}'s message "${reaction.message.content}" gained a SSN!`);

            // Add user data to ssn.json if they don't exist
            if (!ssn[reaction.message.author.id]) ssn[reaction.message.author.id] = {
                username: reaction.message.author.username,
                SSN: 0
            };

            // Increment the value of SSN and write to the JSON file
            const ssnData = ssn[reaction.message.author.id];
            ssnData.SSN++;
            console.log(`<SSNTracker> ${JSON.stringify(ssnData)}`);
            fs.writeFileSync('./json/ssn.json', JSON.stringify(ssn), (err) => {
                if (err) console.error(err);
            });

            // Add user data to ssnGiver.json if they don't exist
            if (!ssnGiver[user.id]) ssnGiver[user.id] = {
                username: user.username,
                ssnGiven: 0
            };

            // Increment the value of SSN and write to the JSON file
            const ssnGiverData = ssnGiver[user.id];
            ssnGiverData.ssnGiven++;
            console.log(`<SSNTracker> ${JSON.stringify(ssnGiverData)}`);
            fs.writeFileSync('./json/ssnGiver.json', JSON.stringify(ssnGiver), (err) => {
                if (err) console.error(err);
            });
        } else if (reaction.message.author.bot) {
            console.log(`<SSNTracker> Not registering SSN as it was added to a bot`);
        } else {
            console.log(`<SSNTracker> SSN count on ${reaction.message.author.tag}'s message "${reaction.message.content}" is ${reaction.count} - no need to track again`);
        }
    } else {
        return 0;
    }
}

module.exports.ssnTrackerFunction = ssnTrackerFunction;