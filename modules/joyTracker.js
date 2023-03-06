const fs = require('fs');
const { DateTime } = require('luxon');

// Read from JSON files
let joy;
try {
    joy = JSON.parse(fs.readFileSync('./joy.json', 'utf8'));
} catch (err) {
    console.error(err);
}

const today = DateTime.now().setZone('Europe/London');
const todayMonth = today.set({ month: 6 }).toFormat('MMMM');
const todayYear = today.toFormat('yyyy');

function joyTrackerFunction(reaction, user) {
    // ----------------
    // SSN Counter
    // ----------------

    if (reaction.emoji.name === '😂') {
        // If this joy react came from Nathan's user ID
        if (user.id === '293477911955243008') {             //  if (user.id === '196045564129968128') { 
            // Add datetime data to joy.json if they don't exist
            if (!joy[`${todayMonth}/${todayYear}`]) joy[`${todayMonth}/${todayYear}`] = {
                joy: 0
            };

            // Increment the value of joy react and write to the JSON file
            const joyData = joy[`${todayMonth}/${todayYear}`];
            joyData.joy++;
            console.log(`<JoyTracker> ${JSON.stringify(joyData)}`);
            fs.writeFileSync('./joy.json', JSON.stringify(joy), (err) => {
                if (err) console.error(err);
            });

            console.log(`<JoyTracker> Nath's joy count increased for ${todayMonth} ${todayYear} to ${joyData.joy}. Message is "${reaction.message.content}"`);
        }
    }
}

module.exports.joyTrackerFunction = joyTrackerFunction;