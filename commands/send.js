module.exports = {
    name: 'send',
    description: 'Command, channel name, message to be sent as the bot',
    execute(message, args) {
        // Declare the channel
        const sendingChannel = message.guild.channels.cache.find(channel => channel.name === args[0]);

        // Declare the message
        var providedMessage = args.slice(1);
        var providedMessageCombined = '';

        // Combine the query if it's >1 word, splitting commas
        for (var i = 0; i < providedMessage.length; i++) {
            providedMessageCombined += providedMessage[i] + ' '
        }

        // If not channel provided, tell user
        if (!sendingChannel) {
            console.log('Channel not found');
            message.channel.send(`The channel provided as an argument does not exist.`);
            return;
        };

        // If no message detected, tell user
        if (!providedMessageCombined) {
            console.log('Message cannot be empty');
            message.channel.send(`Message cannot be empty.`);
            return;
        };

        // Only run if the sender of the message is an admin
        if (message.member.hasPermission("ADMINISTRATOR")) {
            // Send the message to the channel
            sendingChannel.send(providedMessageCombined);
            console.log('Bot sent: ' + providedMessageCombined + 'to #' + sendingChannel.name);
        };
    }
};