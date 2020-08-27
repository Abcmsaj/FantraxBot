const Discord = require('discord.js');
const fs = require('fs');
const { prefix, token, redCardChannel, approverId } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

// Read from JSON files
const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));

// Login
client.login(token);

// Import commands from folder
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
    console.log(command)
};

// Add cooldowns
const cooldowns = new Discord.Collection();
// Create date
var today = new Date();
var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date + ' ' + time;

client.once('ready', () => {
    console.log('Ready!');

});

// -----------------------------------------------
// Send messages based on triggers from JSON file
// -----------------------------------------------
client.on('message', message => {
    // Read from the reactions file
    const reacts = JSON.parse(fs.readFileSync("./reacts.json", "utf8"));

    // If the reaction comes from a bot then don't trigger - might end up in an infinite loop
    if (message.author.bot) {
        return 0;
    } else {
        // Read the file
        fs.readFile('./reacts.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Iterate through all the keys in the reacts.json file
                Object.keys(reacts).forEach(item => {
                    // If any of the keys match with the message when both lower case, we need to check case sensitvitity
                    if (message.content.toLowerCase().includes(item.toLowerCase())) {
                        // Store all the vals from JSON as vars
                        var matchedKey = reacts[item]
                        var reply = matchedKey['reply']
                        var caseSensitivity = matchedKey['caseSensitivity']
                        var usedAnywhere = matchedKey['usedAnywhere']

                        // Get other vars from message content
                        if (item.toLowerCase() === message.content.toLowerCase()) {
                            // And "exact phrase" is where the key matches the message exactly, regardless of casing
                            var exactPhrase = 1
                        } else {
                            var exactPhrase = 0
                        }

                        if (message.content.includes(item)) {
                            // Case match
                            var casesMatch = 1
                        } else {
                            var casesMatch = 0
                        }

                        console.log('Does the phrase match: ' + exactPhrase)
                        console.log('Do cases match: ' + casesMatch)

                        if (caseSensitivity === 1 && casesMatch === 1) {
                            //Case sens matters and cases match, proceed
                            if (usedAnywhere === 1) {
                                // Phrase can be used anywhere so send
                                message.channel.send(reply);
                                console.log('Bot replied to ' + item + '. Case-sensitivity = 1, Used Anywhere = 1')
                            } else if (usedAnywhere === 0 && exactPhrase === 1) {
                                // Phrase can't be used anywhere so has to be an exact match
                                // If it is, we can send it
                                message.channel.send(reply);
                                console.log('Bot replied to ' + item + '. Case-sensitivity = 1, Used Anywhere = 0')
                            }
                        } else if (caseSensitivity === 0) {
                            //Cases don't matter, proceed
                            if (usedAnywhere === 1) {
                                // Phrase can be used anywhere so send
                                message.channel.send(reply);
                                console.log('Bot replied to ' + item + '. Case-sensitivity = 0, Used Anywhere = 1')
                            } else if (usedAnywhere === 0 && exactPhrase === 1) {
                                // Phrase can't be used anywhere so has to be an exact match
                                // If it is, we can send it
                                message.channel.send(reply);
                                console.log('Bot replied to ' + item + '. Case-sensitivity = 0, Used Anywhere = 0')
                            }
                        } else {
                            // Cases DO matter, end
                            console.log('Bot did not reply to ' + item + '. Case-sensitivity did not match')
                            return 0;
                        }
                    }
                });
            }
        });
    }
});

// ---------------------------------
// Send responses based on messages
// ---------------------------------
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // command can be any casing

    if (!client.commands.has(command)) return;

    // Add some cooldown logic to stop commands being spammed
    if (!cooldowns.has(command)) {
        cooldowns.set(command, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command);
    const cooldownAmount = (command.cooldown || 10) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            // If the expirationTime has not passed, you return a message letting the user know how much time is left until they can use that command again.
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command}\` command.`).then((msg) => {
                msg.delete({ timeout: 2000 })
            });
        }
    }
    // if the timestamps collection doesn't have the message author's ID (or if the author ID did not get deleted as planned), 
    // .set() the author ID with the current timestamp and create a setTimeout() to automatically delete it after the cooldown period has passed
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        client.commands.get(command).execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

// ----------------
// Red Card Counter
// ----------------
client.on('messageReactionAdd', async (reaction, message, user) => {
    // console.log(message.content);

    // Pull in partial messages from before the bot was active
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        };
    };

    // Conditional arg for adding red cards to messages
    if (reaction.emoji.name === '🟥') {
        // Only trigger this if statement if the card is the FIRST given - don't count duplicates
        // Also don't trigger if someone red cards a bot
        if (reaction.count === 1 && !reaction.message.author.bot) {
            // If this was the first time that a red card was given then follow this route
            console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a provisional red card at ${dateTime}!`);

            // Generate a pretty embedded post
            const cardEmbed = new Discord.MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Red Card Infraction')
                .setAuthor('Mostly-Palatable Premier Division', 'https://imgur.com/S1WDyVU.jpg')
                .setThumbnail('https://imgur.com/2ceCkDk.jpg')
                .addFields(
                    { name: 'Message', value: `${reaction.message.content}` },
                    { name: 'Offence committed by', value: `${reaction.message.author}`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Channel', value: `${reaction.message.channel}`, inline: true },
                    { name: 'Link', value: `https://discordapp.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}`, inline: true }
                )
                .setTimestamp();

            // Define a confirmation filter that only the approver ID can activate (Adam)
            const confirmFilter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === approverId;
            };

            client.channels.cache.get(redCardChannel).send(cardEmbed)
                .then(message => {
                    // Send message
                    console.log('Message sent to Channel');

                    // Add checkmark emoji for appprover to confirm
                    message.react('✅')
                        .then(() => {
                            message.react('❌');
                            console.log('Confirmation buttons added');

                            // Add user data to cards.json if they don't exist
                            if (!cards[reaction.message.author.id]) cards[reaction.message.author.id] = {
                                username: reaction.message.author.username,
                                provisional: 0,
                                confirmed: 0
                            };

                            // Increment the value of provisional cards and write to the JSON file
                            const cardData = cards[reaction.message.author.id];
                            cardData.provisional++;
                            console.log(cardData);
                            fs.writeFileSync('./cards.json', JSON.stringify(cards), (err) => {
                                if (err) console.error(err);
                            });
                        })

                    // Await a reaction to the message from the filter (approver and approved emotes)
                    message.awaitReactions(confirmFilter, { max: 1 })
                        .then(collected => {
                            const approvalReaction = collected.first();
                            // In here, write what we want to do when Adam confirms the card
                            // If Green, else if Red...
                            if (approvalReaction.emoji.name === '✅') {
                                // If accepted, increment the counter for approved and remove a provisional 
                                console.log('Approved');
                                console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a confirmed red card from ${dateTime}!`);

                                // Add one to confirmed value and take away a provisional card
                                const cardData = cards[reaction.message.author.id];
                                cardData.confirmed++;
                                cardData.provisional--;
                                console.log(cardData);
                                fs.writeFileSync('./cards.json', JSON.stringify(cards), (err) => {
                                    if (err) console.error(err);
                                });

                            } else {
                                // If rejected, delete the message
                                console.log('Rejected');
                                approvalReaction.message.delete({ timeout: 1000 })
                                    .then(() => {
                                        client.channels.cache.get(redCardChannel).send('Provisional card removed')
                                            .then(deleteMessage => {
                                                deleteMessage.delete({ timeout: 3000 });
                                            });
                                    });
                            };
                        });
                });
        } else if (reaction.message.author.bot) {
            console.log(`Not registering card as it was added to a bot`);
        } else {
            console.log(`Reaction count is ${reaction.count} - no need to post again`);
        }
    } else {
        return 0;
    }

});