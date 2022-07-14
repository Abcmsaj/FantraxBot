module.exports = {
    name: 'totalcards',
    description: 'Sends a message to channel displaying all card totals',
    cooldown: 60,
    execute(message, args) {
        const fs = require('fs');
        const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));

        fs.readFile('./cards.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Create new array to sort values
                var sortedArray = [];

                // Populate it with each item
                Object.values(cards).forEach(item => {
                    sortedArray.push(item);
                });

                // Actually sort the array in descending order
                sortedArray.sort(function (a, b) {
                    return b.confirmed - a.confirmed;
                });

                var totalCards = 'User │ Nominations │ Confirmed\n';

                // Loop through sortedArray to generate the table, now in Confirmed card order
                Object.values(sortedArray).forEach(item => {
                    totalCards += item.username + ' │ ' + item.provisional + ' │ ' + item.confirmed + '\n';
                });

                message.channel.send('**Total cards**:\n```json\n' + totalCards + '\n```');
            };
        });
    },
};