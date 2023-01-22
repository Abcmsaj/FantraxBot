const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const fs = require('fs');
// Read from JSON files
let reacts;
try {
    reacts = JSON.parse(fs.readFileSync("./reacts.json", "utf8"));
} catch (err) {
    console.log(`<React> ${err}`);
}

module.exports = {
    name: 'react',
    description: 'Add a reaction to the JSON.',
    execute(message, args) {
        // Only run if user is admin
        if (message.member.permissions.has('ADMINISTRATOR')) {
            // If no arguments after !react then tell use
            if (!args[0]) {
                console.log('<React> No trigger phrase provided')
                return message.reply('Need a trigger phrase first');
            }

            // Create the trigger and get all args and combine them
            var trigger = '';
            var arrayLength = args.length;

            for (var i = 0; i < arrayLength; i++) {
                console.log(`<React> Trigger provided: ${args[i]}`);

                trigger += args[i] + ' ';
            }

            // Trim the final whitespace from the end of the trigger
            trigger = trigger.trim();
            console.log('<React> Trigger created');

            // Declare the two other vars by default
            var usage = 0;
            var casing = 0;
            // User would have to edit the json to change these - this is a future todo with reaction collector

            // Get channel for use later and create message collector. Declare blank variable for response to be edited later
            const originalAuthor = message.author.id;
            const channel = message.channel;
            const filter = (m) => {
                return m.author.id === message.author.id;
            };
            const messageCollector = channel.createMessageCollector({ filter, max: 1, time: 10000 });
            var response;

            message.reply('Provide the response.')
                .then(() => {
                    // Collect a response and set it to the response var
                    messageCollector.on('collect', userResp => {
                        response = userResp.content;
                        return response;
                    });

                    // When collecting is finished, either after 10 secs or when 1 resp is received
                    messageCollector.on('end', message => {
                        // Read the reacts file to ensure it exists
                        fs.readFile('./reacts.json', (err) => {
                            if (err) {
                                throw err;
                            } else {
                                // If there was no response, send message to channel
                                if (!response) {
                                    console.log('<React> There was no response, timed out');
                                    return channel.send('No response provided, timed out.');
                                } else {
                                    // Send another message and start a reaction collector
                                    channel.send('Any additional options?')
                                        .then((message) => {
                                            message.react('🌍')
                                                .then(() => {
                                                    message.react('🅰️');
                                                });

                                            const reactionFilter = (reaction, user) => {
                                                return ['🌍', '🅰️'].includes(reaction.emoji.name) && user.id === originalAuthor;
                                            };

                                            const reactionCollector = message.createReactionCollector({ reactionFilter, max: 2, time: 10000 });

                                            reactionCollector.on('collect', (reaction, user) => {
                                                if (reaction.emoji.name === '🌍') {
                                                    console.log(`<React> Collected ${reaction.emoji.name} from ${user.tag}`);
                                                    usage = 1;
                                                    return usage;
                                                } else if (reaction.emoji.name === '🅰️') {
                                                    console.log(`<React> Collected ${reaction.emoji.name} from ${user.tag}`);
                                                    casing = 1;
                                                    return casing;
                                                }
                                            });

                                            // On reaction collector end
                                            reactionCollector.on('end', collected => {
                                                console.log(`<React> Casing is ${casing} and usage is ${usage}`);

                                                // Add to reacts.json
                                                if (reacts[trigger]) {
                                                    // If it does exist, tell user
                                                    console.log(`<React> Reaction '${trigger}' exists, nothing saved`);
                                                    return channel.send('Unable to add reaction as it already exists');
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
                                                channel.send(`Reaction ${trigger} added with response: ${response}.\nCasing is ${casing} and usage is ${usage}.`);
                                                console.log('<React> Reaction does not exist in reacts.json');
                                                console.log(`<React> Added reaction to reacts.json: ${trigger} -> ${response}`);
                                                return;
                                            });
                                        });
                                }
                            }
                        });
                    });
                });
        }
    }
};