const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'cards',
    description: 'Sends a message to the user that requested the command, letting them know their card numbers',
    data: new SlashCommandBuilder()
        .setName('cards')
        .setDescription(`Returns the user's nominated reds, confirmed reds, and card allowance`),
    cooldown: 10,
    async execute(interaction) {
        const cardsPath = path.join(__dirname, '../json/cards.json');
        const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

        const cardData = cards[interaction.user.id];

        var response = '';

        if (cardData.provisional === 1) {
            response += `You currently have ${cardData.provisional} nominated red card,`;
        } else {
            response += `You currently have ${cardData.provisional} nominated red cards,`;
        };

        if (cardData.confirmed === 1) {
            response += ` ${cardData.confirmed} confirmed red card,`;
        } else {
            response += ` ${cardData.confirmed} confirmed red cards,`;
        };

        if (cardData.cardAllowance === 1) {
            response += ` and ${cardData.cardAllowance} red card left to give out this month.`;
        } else if (cardData.cardAllowance < 0) {
            // Have to add this because logic in Red Card Tracker can put a person at negative allowed reds in order to prevent spam of automated message from bot
            response += ` and 0 red cards left to give out this month.`;
        } else {
            response += ` and ${cardData.cardAllowance} red cards left to give out this month.`;
        };

        // Send compiled response
        interaction.reply(response);
        console.log(`<Cards> ${interaction.user.username} requested their card count`);
        console.log(`<Cards> Nominated: ${cardData.provisional}`);
        console.log(`<Cards> Confirmed: ${cardData.confirmed}`);
        console.log(`<Cards> Allowance: ${cardData.cardAllowance}`);
    },
};