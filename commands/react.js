const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Read from JSON files
let reacts;
try {
    reacts = JSON.parse(fs.readFileSync("./reacts.json", "utf8"));
} catch (err) {
    console.log(`<React> ${err}`);
}

module.exports = {
    name: 'react',
    description: 'Add a reaction to the JSON file',
    data: new SlashCommandBuilder()
        .setName('react')
        .setDescription('Add a reaction which can be triggered by messages in the Discord')
        .addStringOption((option) => option
            .setName('trigger')
            .setDescription('The word or phrase that will trigger the reaction')
            .setRequired(true))
        .addStringOption((option) => option
            .setName('response')
            .setDescription('The response that the bot will send')
            .setRequired(true))
        .addBooleanOption((option) => option
            .setName('casing')
            .setDescription('True = match case, false = not care about casing')
            .setRequired(true))
        .addBooleanOption((option) => option
            .setName('anywhere')
            .setDescription('True = any word in phrase, false = exact word/phrase')
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only,
    async execute(interaction) {
        const trigger = interaction.options.getString('trigger');
        const response = interaction.options.getString('response');
        const casing = Number(interaction.options.getBoolean('casing')); // Number converts t/f into 1/0
        const usage = Number(interaction.options.getBoolean('anywhere'));

        // Add to reacts.json
        if (reacts[trigger]) {
            // If it does exist, tell user
            console.log(`<React> Reaction '${trigger}' exists, nothing saved`);
            return interaction.reply('Unable to add reaction as it already exists');
        }
        // Add react data to reacts.json if it doesn't exist
        if (!reacts[trigger]) reacts[trigger] = {
            reply: response,
            caseSensitivity: casing,
            usedAnywhere: usage
        };

        // Write to the file
        fs.writeFileSync('./reacts.json', JSON.stringify(reacts), (err) => {
            if (err) console.error(err);
        });
        // Message channel to say it's been added
        console.log('<React> Reaction does not exist in reacts.json');
        console.log(`<React> Added reaction to reacts.json: ${trigger} -> ${response}`);
        return interaction.reply(`Reaction ${trigger} added with response: ${response}.\nCasing is ${casing} and usage is ${usage}.`);
    }
};