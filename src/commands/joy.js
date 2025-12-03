const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, SlashCommandBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'joy',
    description: 'Select a month and see a table of joy reacts',
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('joy')
        .setDescription('Responds with a leaderboard of joy reactions in the Discord'),
    async execute(interaction) {
        const joyPath = path.join(__dirname, '../json/joy.json');
        // Read the joy.json file
        try {
            joy = JSON.parse(fs.readFileSync(joyPath, 'utf8'));
        } catch (err) {
            console.error(err);
        }

        // Get the list of month/year from the joy.json file to use in our ActionRowBuilder
        let options = [];

        // Populate the array with each item
        Object.keys(joy).forEach(item => {
            options.push({ label: item.replace('/', ' '), value: item });
        });

        // Generate a select menu with all the available months in
        const menu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('joy')
                    .setPlaceholder('Select a date')
                    .addOptions(
                        options.slice(-25) // This is our object of dates
                    ),
            );
        await interaction.deferReply(); // If I don't defer the reply first, the select menu fails to show on mobile
        await interaction.editReply({ content: 'Choose a month to see joy react data for 😂😂😂', ephemeral: true, components: [menu] });
    },
};