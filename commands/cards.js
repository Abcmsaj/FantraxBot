module.exports = {
    name: 'cards',
    description: 'Sends a message to the user that requested the command, letting them know their card numbers',
    cooldown: 10,
    execute(message, args) {
        const fs = require('fs');
        const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));
        const cardData = cards[message.author.id];

        var response = '';

        if (cardData.provisional === 1) {
            response += `you currently have ${cardData.provisional} nominated red card,`;
        } else {
            response += `you currently have ${cardData.provisional} nominated red cards,`;
        };

        if (cardData.confirmed === 1) {
            response += ` ${cardData.confirmed} confirmed red card,`;
        } else {
            response += ` ${cardData.confirmed} confirmed red cards,`;
        };

        if (cardData.cardAllowance === 1) {
            response += ` and ${cardData.cardAllowance} red card left to give out this month.`
        } else if (cardData.cardAllowance < 0) {
            // Have to add this because logic in Red Card Tracker can put a person at negative allowed reds in order to prevent spam of automated message from bot
            response += ` and 0 red cards left to give out this month.`;
        } else {
            response += ` and ${cardData.cardAllowance} red cards left to give out this month.`;
        };

        // Send compiled response
        message.reply(response);
    },
};