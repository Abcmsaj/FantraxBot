const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const fs = require('fs');
const reacts = JSON.parse(fs.readFileSync("./reacts.json", "utf8"));

module.exports = {
    name: 'react',
    description: 'Add a reaction to the JSON.',
    execute(message, args) {
        // If no arguments after !react then tell use
        if (!args) {
            message.reply('need a trigger phrase first');
            return;
        }

        // Create the trigger and get all args and combine them
        var trigger = '';
        var arrayLength = args.length

        for (var i = 0; i < arrayLength; i++) {
            console.log(args[i]);

            trigger += args[i] + ' '
        }

        // Trim the final whitespace from the end of the trigger
        trigger = trigger.trim()
        console.log('Trigger created')

        // Declare the two other vars by default
        const usage = 0;
        const casing = 0;
        // User would have to edit the json to change these - this is a future todo with reaction collector

        // Get channel for use later and create message collector. Declare blank variable for response to be edited later
        const channel = message.channel
        const messageCollector = new Discord.MessageCollector(channel, m => m.author.id === message.author.id, { max: 1, time: 10000 });
        var response;

        message.reply('provide the response.')
            .then(() => {
                // Collect a response and set it to the response var
                messageCollector.on('collect', userResp => {
                    response = userResp.content;
                    return response;
                })

                // When collecting is finished, either after 10 secs or when 1 resp is received
                messageCollector.on('end', message => {
                    // Read the reacts file to ensure it exists
                    fs.readFile('./reacts.json', (err) => {
                        if (err) {
                            throw err;
                        } else {
                            // If there was no response, send message to channel
                            if (!response) {
                                channel.send('No response provided, timed out.')
                                console.log('There was no response')
                                return;
                            } else {
                                // Add to reacts.json
                                if (reacts[trigger]) {
                                    // If it does exist, tell user
                                    channel.send('Unable to add reaction as it already exists');
                                    console.log('Reaction exists, nothing saved');
                                    return;
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
                                channel.send('Reaction added')
                                console.log('Reaction does not exist in reacts.json');
                                console.log('Added reaction to reacts.json');
                                return;
                            }
                        }
                    })
                });
            });
    }
};