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

async function joyResponderFunction(interaction, date) {
    // ----------------
    // Joy Responder
    // ----------------

    /* This function responds to the select menu from commands/joy.js via the interactionCreate event in index.js
    It will send over the selected option from the menu and we'll update the interaction with the table for
    the selected month */

    let spacing = '                    ';

    function remainingSpacing(text) {
        return spacing.substring(0, (spacing.length - text.length));
    }

    // Create new array to sort values
    var sortedArray = [];

    // Populate it with each item
    Object.values(joy[date]).forEach(item => {
        sortedArray.push(item);
    });

    // Actually sort the array in descending order
    sortedArray.sort(function (a, b) {
        return b.joy - a.joy;
    });

    var totalJoy = `User${remainingSpacing('User')}│${remainingSpacing('No. of 😂 reacts')}No. of 😂 reacts\n`;

    // Loop through the sorted array to get each username and SSN val, now in desc order
    Object.values(sortedArray).forEach(item => {
        totalJoy += `${item.user}${remainingSpacing(item.user)}│${remainingSpacing('No. of 😂 reacts')}${item.joy}\n`;
    });

    // Update the interaction with the month/year and a table of joy reacts for that month
    await interaction.update({ content: `😂 ${date.replace('/', ' ')} selected`, components: [] });
    await interaction.followUp({ content: `**Total 😂 reacts for ${date.replace('/', ' ')}**:\n\`\`\`json\n${totalJoy}\`\`\`\n`, ephemeral: false });

    console.log(`<JoyResponder> Joy reacts for ${date.replace('/', ' ')} sent to #${interaction.channel.name}`);
}

module.exports.joyTrackerFunction = joyTrackerFunction;
module.exports.joyResponderFunction = joyResponderFunction;