module.exports = {
    name: 'prune',
    description: 'Prune up to 99 messages.',
    execute(message, args) {
        const amount = parseInt(args[0]) + 1;

        // Only run if the sender of the message is an admin
        if (message.member.permissions.has('ADMINISTRATOR')) {
            if (isNaN(amount)) {
                console.log('<Prune> Failed because no number was provided')
                return message.reply(`That isn't a valid number.`);
            } else if (amount <= 1 || amount > 100) {
                console.log('<Prune> Failed because number was not between 1 and 99')
                return message.reply('You need to input a number between 1 and 99.');
            }

            message.channel.bulkDelete(amount, true).catch(err => {
                console.error(err);
                message.channel.send('<Prune> There was an error trying to prune messages in this channel!');
            });
        }

        console.log(`<Prune> ${amount} messages removed by ${message.member.user.username} in the ${message.channel.name} channel`)
    },
};