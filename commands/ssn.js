module.exports = {
    name: 'ssn',
    description: 'Shows a leaderboard of SSN',
    cooldown: 60,
    execute(message, args) {
        const fs = require('fs');
        const ssn = JSON.parse(fs.readFileSync("./ssn.json", "utf8"));

        fs.readFile('./ssn.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Create new array to sort values
                var sortedArray = [];

                // Populate it with each item
                Object.values(ssn).forEach(item => {
                    sortedArray.push(item);
                })

                // Actually sort the array in descending order
                sortedArray.sort(function (a, b) {
                    return b.SSN - a.SSN;
                });

                var totalSSN = 'User │ SSN received \n';

                // Loop through the sorted array to get each username and SSN val, now in desc order
                Object.values(sortedArray).forEach(item => {
                    totalSSN += item.username + ' │ ' + item.SSN + '\n';
                });

                message.channel.send('**Total SSN**:\n```json\n' + totalSSN + '\n```');
                console.log(`<SSN> ${message.author.username} requested SSN in #${message.channel.name}`)
            };
        });
    },
};