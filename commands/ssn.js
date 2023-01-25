const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'ssn',
    description: 'Shows a leaderboard of SSN',
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('ssn')
        .setDescription('Responds with a leaderboard SSNs in the Discord'),
    async execute(interaction) {
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
                });

                // Actually sort the array in descending order
                sortedArray.sort(function (a, b) {
                    return b.SSN - a.SSN;
                });

                var totalSSN = 'User │ SSN received \n';

                // Loop through the sorted array to get each username and SSN val, now in desc order
                Object.values(sortedArray).forEach(item => {
                    totalSSN += item.username + ' │ ' + item.SSN + '\n';
                });

                interaction.reply('**Total SSN**:\n```json\n' + totalSSN + '\n```');
                console.log(`<SSN> ${interaction.user.username} requested SSN in #${interaction.channel.name}`);
            };
        });
    },
};