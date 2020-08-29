const { prefix } = require('./../FantraxConfig/config.json');
const pollEmbed = require('discord.js-poll-embed');

module.exports = {
    name: 'poll',
    description: 'Creates a poll used by discord.jspoll-embed',
    execute(message, args) {
        // Remove !Poll from the start
        var input = message.content.slice(prefix.length + 5);

        // Split the message by semicolon to separate out the vars
        var fields = input.split(';');

        // Set the vars for title, optionsArray, and a timeout
        var title = fields[0];
        var options = fields[1];

        // Take options and split by comma to form array
        if (options) {
            var optionsArray = options.split(',');
        };

        if ((fields[2] % 1) === 0) {
            // If the timeout is a whole int then set it
            var timeout = fields[2];
        } else {
            // Otherwise default to 10 mins
            var timeout = 600;
        };

        // Send the poll message to the channel
        if (!title || !options || !timeout) {
            message.channel.send('📊 Poll is missing attributes. Format is title;**option1**,option2,**option3**,etc;timeout');
        } else {
            pollEmbed(message, title, optionsArray, timeout);
        };
    },
};