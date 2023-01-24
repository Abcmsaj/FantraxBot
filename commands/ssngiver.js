const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'ssngiver',
    description: 'Shows a leaderboard of people who have given out SSN',
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('ssngiver')
        .setDescription('this is a test command!'),
    async execute(interaction) {
        const fs = require('fs');
        const ssnGiver = JSON.parse(fs.readFileSync("./ssnGiver.json", "utf8"));

        fs.readFile('./ssnGiver.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Create new array to sort values
                var sortedArray = [];

                // Populate it with each item
                Object.values(ssnGiver).forEach(item => {
                    sortedArray.push(item);
                });

                // Actually sort the array in descending order
                sortedArray.sort(function (a, b) {
                    return b.ssnGiven - a.ssnGiven;
                });

                var totalSSNGiven = 'User │ SSN given out \n';

                // Loop through the sorted array to get each username and SSN val, now in desc order
                Object.values(sortedArray).forEach(item => {
                    totalSSNGiven += item.username + ' │ ' + item.ssnGiven + '\n';
                });

                interaction.reply('**Total SSN Given**:\n```json\n' + totalSSNGiven + '\n```');
                console.log(`<SSNGiver> ${interaction.user.username} requested SSN Givers in #${interaction.channel.name}`);
            };
        });
    },
};