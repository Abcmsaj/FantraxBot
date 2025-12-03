const fs = require('fs');
const path = require('path');

function ssnTrackerFunction(reaction, user) {
    // ----------------
    // SSN Counter
    // ----------------

    // [FIX] Resolve paths relative to this file
    const ssnPath = path.join(__dirname, '../json/ssn.json');
    const ssnGiverPath = path.join(__dirname, '../json/ssnGiver.json');

    // Read from JSON files
    let ssn;
    try {
        ssn = JSON.parse(fs.readFileSync(ssnPath, "utf8"));
    } catch (err) {
        console.error(err);
    }

    let ssnGiver;
    try {
        ssnGiver = JSON.parse(fs.readFileSync(ssnGiverPath, "utf8"));
    } catch (err) {
        console.error(err);
    }

    if (reaction.emoji.name === 'ssn') {
        if (reaction.count === 1 && !reaction.message.author.bot) {
            console.log(`<SSNTracker> ${reaction.message.author.tag}'s message "${reaction.message.content}" gained a SSN!`);

            if (!ssn[reaction.message.author.id]) ssn[reaction.message.author.id] = {
                username: reaction.message.author.username,
                SSN: 0
            };

            const ssnData = ssn[reaction.message.author.id];
            ssnData.SSN++;
            console.log(`<SSNTracker> ${JSON.stringify(ssnData)}`);
            fs.writeFileSync(ssnPath, JSON.stringify(ssn), (err) => {
                if (err) console.error(err);
            });

            if (!ssnGiver[user.id]) ssnGiver[user.id] = {
                username: user.username,
                ssnGiven: 0
            };

            const ssnGiverData = ssnGiver[user.id];
            ssnGiverData.ssnGiven++;
            console.log(`<SSNTracker> ${JSON.stringify(ssnGiverData)}`);
            fs.writeFileSync(ssnGiverPath, JSON.stringify(ssnGiver), (err) => {
                if (err) console.error(err);
            });
        } else if (reaction.message.author.bot) {
            console.log(`<SSNTracker> Not registering SSN as it was added to a bot`);
        } else {
            console.log(`<SSNTracker> SSN count on ${reaction.message.author.tag}'s message "${reaction.message.content}" is ${reaction.count} - no need to track again`);
        }
    }
}

module.exports.ssnTrackerFunction = ssnTrackerFunction;