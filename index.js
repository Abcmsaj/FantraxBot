const Discord = require('discord.js');
const pollEmbed = require('discord.js-poll-embed');
const fs = require('fs');
const { prefix, token, redCardChannel, approverId } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.login(token);
const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));


// Create date
var today = new Date();
var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date + ' ' + time;

client.once('ready', () => {
    console.log('Ready!');

});

// Reaction collector
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
        }
    }

    // Conditional arg for adding red cards to messages
    if (reaction.emoji.name === '🟥') {
        // Only trigger this if statement if the card is the FIRST given - don't count duplicates
        if (reaction.count === 1) {
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
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Offence committed by', value: `${reaction.message.author}`, inline: true },
                    { name: 'Channel', value: `${reaction.message.channel}`, inline: true }
                )
                .setTimestamp();

            // Define a confirmation filter that only the approver ID can activate (Adam)
            const confirmFilter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === approverId;
            };

            client.channels.cache.get(redCardChannel).send(cardEmbed)
                .then(message => {
                    // Send message
                    console.log('Message sent to Channel')

                    // Add checkmark emoji for appprover to confirm
                    message.react('✅')
                        .then(() => {
                            message.react('❌')
                            console.log('Confirmation buttons added')

                            // Add user data to cards.json if they don't exist
                            if (!cards[reaction.message.author.id]) cards[reaction.message.author.id] = {
                                username: reaction.message.author.username,
                                provisional: 0,
                                confirmed: 0
                            }

                            // Increment the value of provisional cards and write to the JSON file
                            const cardData = cards[reaction.message.author.id];
                            cardData.provisional++;
                            console.log(cardData)
                            fs.writeFileSync('./cards.json', JSON.stringify(cards), (err) => {
                                if (err) console.error(err)
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
                                console.log('Approved')
                                console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a confirmed red card at ${dateTime}!`);

                                // Add one to confirmed value and take away a provisional card
                                const cardData = cards[reaction.message.author.id];
                                cardData.confirmed++;
                                cardData.provisional--;
                                console.log(cardData)
                                fs.writeFileSync('./cards.json', JSON.stringify(cards), (err) => {
                                    if (err) console.error(err)
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
        } else {
            console.log(`Reaction count is ${reaction.count} - no need to post again`)
        }
    } else {
        return 0;
    }

});

// Read back the Red Card data
client.on('message', message => {
    // Commands to read red card info
    if (!message.content.startsWith(prefix)) return;

    const cardData = cards[message.author.id];
    if (message.content.startsWith(prefix + 'cards')) {
        if (cardData.provisional === 1 && cardData.confirmed === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red card, and ${cardData.confirmed} confirmed red card.`);
        } else if (cardData.provisional === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red card, and ${cardData.confirmed} confirmed red cards.`);
        } else if (cardData.confirmed === 1) {
            message.reply(`you currently have ${cardData.provisional} nominated red cards, and ${cardData.confirmed} confirmed red card.`);
        } else {
            message.reply(`you currently have ${cardData.provisional} nominated red cards, and ${cardData.confirmed} confirmed red cards.`);
        }
    }

    if (message.content.startsWith(prefix + 'totalcards')) {
        fs.readFile('./cards.json', (err, data) => {
            if (err) {
                throw err;
            } else {
                var totalCards = ''

                Object.values(cards).forEach(item => {
                    console.log(item);
                    console.log(item.username)
                    console.log(item.provisional)
                    console.log(item.confirmed)

                    totalCards += item.username + ' - ' + item.provisional + ' nominations, ' + item.confirmed + ' confirmed. \n'
                });

                message.channel.send('**Total cards**:\n```json\n' + totalCards + '\n```');
            }
        });
    }
})