const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'ssn',
    description: 'Shows a leaderboard of SSN',
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('ssn')
        .setDescription('Responds with a leaderboard SSNs in the Discord'),
    async execute(interaction) {
        const ssnPath = path.join(__dirname, '../json/ssn.json');
        const ssn = JSON.parse(fs.readFileSync(ssnPath, "utf8"));

        fs.readFile(ssnPath, (err) => {
            if (err) {
                throw err;
            } else {
                let spacing = '                ';

                function remainingSpacing(text) {
                    return spacing.substring(0, (spacing.length - text.length));
                }

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

                var totalSSN = `User${remainingSpacing('User')}│ SSN received \n`;

                // Loop through the sorted array to get each username and SSN val, now in desc order
                Object.values(sortedArray).forEach(item => {
                    totalSSN += `${item.username}${remainingSpacing(item.username)}│ ${item.SSN}\n`;
                });

                interaction.reply('**Total SSN**:\n```json\n' + totalSSN + '\n```');
                console.log(`<SSN> ${interaction.user.username} requested SSN in #${interaction.channel.name}`);
            };
        });
    },
};