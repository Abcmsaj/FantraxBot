const fs = require('fs');
const CronJob = require('cron').CronJob;
const { DateTime } = require('luxon');

/* The index.js will create a blank JSON for birthdays. It needs to be manually populated forEach person with the following info:

    "userId": {
        "username": "userName",
        "name": "realName",
        "birthday": "Day Month", (day has no padding, month is long string)
        "isBirthdayToday": 0,
        "currentNickname": ""
    } */

function birthdayCheck() {
    console.log('Will execute at 00:00 every night');

    const today = DateTime.now().setZone('Europe/London');
    // Day = today.toFormat('d')   Month = today.toFormat('MMMM')
    let birthdays;
    let birthdaysArr = [];

    // Get the birthdays.json file
    try {
        birthdays = JSON.parse(fs.readFileSync("./birthdays.json", "utf8"));
    } catch (err) {
        console.error(err);
    }

    // Check to see if anyone isBirthday = 1, and if it is, set their nickname to currentNickname and reset isBirthday = 0

    // Loop through every day and see if it matches today's date (use no padding day and long month)

    // If there is a match, add the user ID to an array (could be multiple on the same day) and update isBirthday = 1 in the JSON file

    // Using UserId, get the user's current nickname and store it to the JSON file, set their nickname to that + 🎂, post a message to #general

}

// Run the function nightly
const job = new CronJob({
    // Run at 00:00 UK time
    cronTime: '00 00 00 * * *',
    onTick: () => {
        birthdayCheck();
    },
    start: true,
    timeZone: 'Europe/London'
});