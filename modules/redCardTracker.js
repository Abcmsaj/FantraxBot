// Define fs
const fs = require('fs');

// Read from JSON files
const cards = JSON.parse(fs.readFileSync("./cards.json", "utf8"));

function redCardTrackerFunction(Discord, reaction, getRedCardChannel, getApproverId, getAdminId, user) {
    // ----------------
    // Red Card Counter
    // ----------------

    // Conditional arg for adding red cards to messages
    if (reaction.emoji.name === '🟥') {
        // Only trigger this if statement if the card is the FIRST given - don't count duplicates
        // Also don't trigger if someone red cards a bot
        if (reaction.count === 1 && !reaction.message.author.bot) {
            // If this was the first time that a red card was given then follow this route
            console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a provisional red card.`);

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
                    { name: 'Card given by', value: `${user}`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Channel', value: `${reaction.message.channel}` },
                    { name: 'Link', value: `https://discordapp.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}` }
                )
                .setTimestamp();

            // Define a confirmation filter that only the approver ID can activate (Adam)
            const confirmFilter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && (user.id === getApproverId || user.id === getAdminId); // hard-coded my User ID to override
            };

            getRedCardChannel.send(cardEmbed)
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
                                console.log(`${reaction.message.author.tag}'s message "${reaction.message.content}" gained a confirmed red card!`);

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
                                        getRedCardChannel.send('Provisional card removed')
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
    }
}

module.exports.redCardTrackerFunction = redCardTrackerFunction;