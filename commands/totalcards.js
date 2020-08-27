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
                var totalCards = ''

                Object.values(cards).forEach(item => {
                    console.log(item);
                    console.log(item.username);
                    console.log(item.provisional);
                    console.log(item.confirmed);

                    totalCards += item.username + ' - ' + item.provisional + ' nominations, ' + item.confirmed + ' confirmed. \n';
                });

                message.channel.send('**Total cards**:\n```json\n' + totalCards + '\n```');
            };
        });
    },
};