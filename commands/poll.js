//const { poll } = require('discord.js-poll');
const Discord = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Create a poll',
    usage: 'Title + Option 1 + Option 2 + Option 3 + etc',
    execute(message, args) {
        poll(message, args, '+', '#ffffff');
    },
};

// This function taken from discord.js-poll and adapted to send the Q as a description instead of title
async function poll(message, args, separator, embedColor) {

    const findSep = args.find(char => char.includes(separator));

    if (findSep === undefined) {

        // If no args provided, return error
        const question = args.join(' ');
        if (!question) {
            return message.channel.send('Please enter a question');
        }

        // Delete original message
        message.delete();
        console.log(message)
        const embed = new Discord.MessageEmbed()
            .setTitle('📊  Poll')
            .setDescription(question)
            .setColor(embedColor)
            .setAuthor({ name: `${message.author.username}`, iconURL: message.author.displayAvatarURL({ format: "png", dynamic: true }) });

        await message.channel.send({ embeds: [embed] }).then(msg => {
            msg.react('👍');
            msg.react('👎');

            console.log('Yes/No poll sent: ' + question)
        });
    }

    else {
        // Delete original message
        message.delete();

        const originalQ = args.join(' ').split(separator)[0] // Get original Q from args
        const embed = new Discord.MessageEmbed();
        const options = [];

        // Remove the Q from the list of args
        for (let i = 0; i < args.length; i++) {
            if (args[i] === separator) {
                args.splice(i, 1);
                const question = args.splice(0, i);
                embed.setTitle('📊  Poll').setDescription(question.join(' '))
                break;
            }
        }

        // Get list of options in an array
        let j = 0;
        for (let i = 0; i < args.length; i++) {
            if (args[i] === separator) {
                args.splice(i, 1);
                options[j] = args.splice(0, i);
                j++;
                i = 0;
            }
        }

        // Declare alphabet emojis
        const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱',
            '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];

        // Create array with original Q (this will be start of description)
        const arr = [originalQ];
        options[j] = args;

        // If more than 26 options, return error
        if (options.length > alphabet.length) {
            return await message.channel.send(`Please don't input more than 26 options.`).then(sent => {
                setTimeout(() => {
                    sent.delete();
                }, 2000);
            });
        }

        // For each option in the array, add to desc and separate with new line
        let count = 0;

        options.forEach(option => {
            arr.push(alphabet[count] + ' ' + option.join(' '));
            count++;
        });

        embed
            .setDescription(arr.join('\n\n'))
            .setColor(embedColor)
            .setAuthor({ name: `${message.author.username}`, iconURL: message.author.displayAvatarURL({ format: "png", dynamic: true }) });

        // Send message to channel and react with alphabet emojis
        await message.channel.send({ embeds: [embed] }).then(msg => {
            for (let i = 0; i < options.length; i++) {
                msg.react(alphabet[i]);
            }
        });

        console.log('Multi choice poll sent: ' + originalQ)
    }
}