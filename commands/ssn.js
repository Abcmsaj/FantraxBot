module.exports = {
    name: 'ssn',
    description: 'Shows a leaderboard of SSN',
    cooldown: 60,
    execute(message, args) {
        const fs = require('fs');
        const ssn = JSON.parse(fs.readFileSync("./ssn.json", "utf8"));

        fs.readFile('./cards.json', (err) => {
            if (err) {
                throw err;
            } else {
                var totalSSN = 'User │ SSN received \n'

                Object.values(ssn).forEach(item => {
                    totalSSN += item.username + ' │ ' + item.SSN + '\n';
                });

                message.channel.send('**Total SSN**:\n```json\n' + totalSSN + '\n```');
            };
        });
    },
};