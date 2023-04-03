const fs = require('fs');
const { DateTime } = require('luxon');

// Read from JSON files
let joy;
try {
    joy = JSON.parse(fs.readFileSync('./joy.json', 'utf8'));
} catch (err) {
    console.error(err);
}

function joyTrackerFunction(reaction, user) {
    // ----------------
    // Joy Counter
    // ----------------

    const today = DateTime.now().setZone('Europe/London');
    const todayMonth = today.toFormat('MMMM');
    const todayYear = today.toFormat('yyyy');

    if (reaction.emoji.name === '😂') {
        // Add datetime data to joy.json if they don't exist

        // If the month doesn't exist in the file yet, add it
        if (!joy[`${todayMonth}/${todayYear}`]) joy[`${todayMonth}/${todayYear}`] = {};

        // If the user reacting doesn't exist in the file yet, add them
        if (!joy[`${todayMonth}/${todayYear}`][user.id]) joy[`${todayMonth}/${todayYear}`][user.id] = {
            user: user.username,
            joy: 0
        };

        // Increment the value of joy react for the user and write to the JSON file
        const joyData = joy[`${todayMonth}/${todayYear}`][user.id];
        joyData.joy++;
        fs.writeFileSync('./joy.json', JSON.stringify(joy), (err) => {
            if (err) console.error(err);
        });

        console.log(`<JoyTracker> ${user.username}'s joy count increased for ${todayMonth} ${todayYear} to ${joyData.joy}. Message is "${reaction.message.content}"`);
    }
}

module.exports.joyTrackerFunction = joyTrackerFunction;