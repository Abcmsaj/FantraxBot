const { DateTime } = require('luxon');
const { guildId } = require('../FantraxConfig/config.json');
const fs = require('fs');

/* The index.js will create a blank JSON for birthdays. It needs to be manually populated forEach person with the following info:

    "userId": {
        "username": "userName",
        "name": "realName",
        "birthday": "Day Month", (day has no padding, month is long string)
        "isBirthdayToday": 0,
        "currentNickname": ""
    } */

async function birthdayCheckerFunction(client) {
    const guild = await client.guilds.fetch(guildId);

    const today = DateTime.now().setZone('Europe/London');
    const todayDay = today.toFormat('d');
    const todayMonth = today.toFormat('MMMM');
    let birthdays;

    console.log(`<BirthdayChecker> Triggered at ${today.toFormat('d MMMM yyyy HH:mm')}`);

    // Get the birthdays.json file
    try {
        birthdays = JSON.parse(fs.readFileSync('./birthdays.json', "utf8"));
    } catch (err) {
        console.error(err);
    }

    // Check to see if anyone isBirthday = 1, and if it is, set their nickname to currentNickname and reset isBirthday = 0
    Object.keys(birthdays).forEach(async userId => {
        const member = await guild.members.fetch(userId);
        const birthday = birthdays[userId];
        const channel = guild.channels.cache.find(channel => channel.name === 'general');

        if (birthday.isBirthdayToday === 1) {
            // reset isBirthdayToday to 0
            birthday.isBirthdayToday = 0;
            console.log(`<BirthdayChecker> Resetting @${birthday.username}'s isBirthday = 0`);

            // reset their nickname
            member.setNickname(birthday.currentNickname);
            console.log(`<BirthdayChecker> Resetting @${birthday.username} nickname to ${birthday.currentNickname}`);

            // Write changes to the JSON file
            fs.writeFileSync('./birthdays.json', JSON.stringify(birthdays));
        }

        // Loop through every day and see if it matches today's date (use no padding day and long month)
        if (birthday.birthday === `${todayDay} ${todayMonth}`) {
            // add the user to the birthday list
            birthday.isBirthdayToday = 1;
            console.log(`<BirthdayChecker> Resetting @${birthday.username}'s isBirthday = 1`);

            // store current nickname
            birthday.currentNickname = member.displayName;
            console.log(`<BirthdayChecker> Stored @${birthday.username} nickname as ${member.displayName}`);

            // update the birthday in the JSON file
            birthdays[userId] = birthday;

            // Set the user's nickname to be their current nickname + cake
            const birthdayNick = `${birthday.currentNickname} 🎂`;
            member.setNickname(birthdayNick);
            console.log(`<BirthdayChecker> Nickname changed to '${birthdayNick}' for ${birthday.username}`);

            // Send a message to the channel
            channel.send(`Happy birthday, <@${member.id}>!!`);
            console.log(`<BirthdayChecker> Birthday message sent to #general for @${birthday.username}`);

            // Write changes to the JSON file
            fs.writeFileSync('./birthdays.json', JSON.stringify(birthdays));
        }
    });
}

module.exports.birthdayCheckerFunction = birthdayCheckerFunction;