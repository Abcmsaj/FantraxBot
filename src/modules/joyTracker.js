const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

// [FIX] Resolve path relative to this file
const joyPath = path.join(__dirname, '../json/joy.json');

// Read from JSON files
let joy;
try {
    joy = JSON.parse(fs.readFileSync(joyPath, 'utf8'));
} catch (err) {
    console.error(err);
}

function joyTrackerFunction(reaction, user) {
    const today = DateTime.now().setZone('Europe/London');
    const todayMonth = today.toFormat('MMMM');
    const todayYear = today.toFormat('yyyy');

    if (reaction.emoji.name === '😂') {
        if (!joy[`${todayMonth}/${todayYear}`]) joy[`${todayMonth}/${todayYear}`] = {};

        if (!joy[`${todayMonth}/${todayYear}`][user.id]) joy[`${todayMonth}/${todayYear}`][user.id] = {
            user: user.username,
            joy: 0
        };

        const joyData = joy[`${todayMonth}/${todayYear}`][user.id];
        joyData.joy++;
        fs.writeFileSync(joyPath, JSON.stringify(joy), (err) => {
            if (err) console.error(err);
        });

        console.log(`<JoyTracker> ${user.username}'s joy count increased for ${todayMonth} ${todayYear} to ${joyData.joy}. Message is "${reaction.message.content}"`);
    }
}

async function joyResponderFunction(interaction, date) {
    let spacing = '                ';
    function remainingSpacing(text) {
        return spacing.substring(0, (spacing.length - text.length));
    }

    var sortedArray = [];
    Object.values(joy[date]).forEach(item => {
        sortedArray.push(item);
    });

    sortedArray.sort(function (a, b) {
        return b.joy - a.joy;
    });

    var totalJoy = `User${remainingSpacing('User')}│ 😂 reacts\n`;

    Object.values(sortedArray).forEach(item => {
        totalJoy += `${item.user}${remainingSpacing(item.user)}│ ${item.joy}\n`;
    });

    await interaction.update({ content: `😂 ${date.replace('/', ' ')} selected`, components: [] });
    await interaction.followUp({ content: `**Total 😂 reacts for ${date.replace('/', ' ')}**:\n\`\`\`json\n${totalJoy}\`\`\`\n`, ephemeral: false });

    console.log(`<JoyResponder> Joy reacts for ${date.replace('/', ' ')} sent to #${interaction.channel.name}`);
}

module.exports.joyTrackerFunction = joyTrackerFunction;
module.exports.joyResponderFunction = joyResponderFunction;