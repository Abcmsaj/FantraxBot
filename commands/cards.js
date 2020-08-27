module.exports = {
    name: 'cards',
    description: 'Sends a message to the user that requested the command, letting them know their card numbers',
    cooldown: 10,
    execute(message, args) {
        const fs = require('fs');
        const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));
        const cardData = cards[message.author.id];

        if (!cards[message.author.id]) {
            message.reply(`you have no cards.`);
        } else if (cardData.provisional === 1 && cardData.confirmed === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red card, and ${cardData.confirmed} confirmed red card.`);
        } else if (cardData.provisional === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red card, and ${cardData.confirmed} confirmed red cards.`);
        } else if (cardData.confirmed === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red cards, and ${cardData.confirmed} confirmed red card.`);
        } else {
            message.reply(`you currently have ${cardData.provisional} nominated red cards, and ${cardData.confirmed} confirmed red cards.`);
        };
    },
};