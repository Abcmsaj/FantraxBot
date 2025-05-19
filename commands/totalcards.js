const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'totalcards',
    description: 'Sends a message to channel displaying all card totals',
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('totalcards')
        .setDescription('Show the number of cards for all users in the Discord'),
    async execute(interaction) {
        const cards = JSON.parse(fs.readFileSync("./json/ards.json", "utf8"));

        // Read cards.json file
        fs.readFile('./json/cards.json', (err) => {
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

                interaction.reply('**Total cards**:\n```json\n' + totalCards + '\n```');
                console.log(`<TotalCards> ${interaction.user.username} requested total cards in #${interaction.channel.name}`);
            };
        });
    },
};