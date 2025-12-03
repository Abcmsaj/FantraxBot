// Define fs
const fs = require('fs');
const path = require('path');

function redCardTrackerFunction(Discord, reaction, getRedCardChannel, getApproverId, getAdminId, user, monthlyCards) {
    // ----------------
    // Red Card Counter
    // ----------------

    // [FIX] Resolve path relative to this file
    const cardsPath = path.join(__dirname, '../json/cards.json');

    // Read from JSON files - this is put inside the function because it will check every time a card is added
    // If no cards.json file on load, it wasn't registering that it existed as this was checked outside the function
    let cards;
    try {
        cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
    } catch (err) {
        console.error(err);
    }

    // Conditional arg for adding red cards to messages
    if (reaction.emoji.name === '🟥') {
        // Only trigger this if statement if the card is the FIRST given - don't count duplicates
        // Also don't trigger if someone red cards a bot
        if (reaction.count === 1 && !reaction.message.author.bot) {
            // Red card allocation check here
            var hasCards;

            // Get the month to compare
            var date = new Date();
            var month = date.getMonth() + 1;

            // Add the data of the reactor to cards.json if they don't exist
            if (!cards[user.id]) cards[user.id] = {
                username: user.username,
                provisional: 0,
                confirmed: 0,
                cardAllowance: monthlyCards,
                monthReset: month
            };

            // Write data if it's missing
            fs.writeFileSync(cardsPath, JSON.stringify(cards), (err) => {
                if (err) console.error(err);
            });

            // Get the card allowance for the user
            const cardAllowance = cards[user.id];

            // Check if we need to reset the card allowance
            if (cardAllowance.monthReset != month) {
                // Reset card allowance to the value in the Config file
                // Update month reset to the new month val
                cardAllowance.cardAllowance = monthlyCards;
                cardAllowance.monthReset = month;
            };

            if (cardAllowance.cardAllowance > 0) {
                hasCards = 1; // Yes, they have cards to give
            } else if (cardAllowance.cardAllowance <= 0) {
                hasCards = 0; // No more cards to give
            };

            // If statement for if card allowance = 0, else, continue
            if (hasCards === 0 && cardAllowance.cardAllowance === 0) {
                reaction.message.channel.send(`${user}, you have no red cards left to give this month.\nYour 🟥 does not count and has been removed.`);
                reaction.remove().catch(error => console.error('Failed to remove reactions: ', error));
                console.log(`<RedCardTracker> Red card not added as ${user.username} has none left to give this month`);

                // Take away another red to put their value at -1, and stop entering this loop
                cardAllowance.cardAllowance--;

                fs.writeFileSync(cardsPath, JSON.stringify(cards), (err) => {
                    if (err) console.error(err);
                });
                return;
            } else if (hasCards === 0 && cardAllowance.cardAllowance < 0) {
                // User has -1 cards so none to give and should not trigger message in chat again 
                console.log(`<RedCardTracker> Red card not added as ${user.username} has none left to give this month`);

                // Remove the reaction
                reaction.remove().catch(error => console.error('Failed to remove reactions: ', error));
                return;
            } else {
                // Tell the user how many cards they have left and subtract one
                cardAllowance.cardAllowance--;
                if (cardAllowance.cardAllowance === 1) {
                    reaction.message.channel.send(`🟥 ${user}, you have ${cardAllowance.cardAllowance} red card left to give this month.`);
                    console.log(`<RedCardTracker> Informed ${user.username} they have ${cardAllowance.cardAllowance} red card left to give this month`);
                } else {
                    reaction.message.channel.send(`🟥 ${user}, you have ${cardAllowance.cardAllowance} red cards left to give this month.`);
                    console.log(`<RedCardTracker> Informed ${user.username} they have ${cardAllowance.cardAllowance} red cards left to give this month`);
                }

                // If this was the first time that a red card was given then follow this route
                console.log(`<RedCardTracker> ${reaction.message.author.tag}'s message "${reaction.message.content}" gained a provisional red card.`);

                // If the message carded is an image, it won't add the red card - so change the content to a string
                if (reaction.message.content === '') {
                    reaction.message.content = 'Image (click link to see)';
                };

                // Generate a pretty embedded post
                const cardEmbed = new Discord.EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Red Card Infraction')
                    //.setAuthor('', 'https://imgur.com/S1WDyVU.jpg')
                    .setThumbnail(reaction.message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    .addFields(
                        { name: 'Message', value: `${reaction.message.content}` },
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Offence by', value: `${reaction.message.author}`, inline: true },
                        { name: 'Channel', value: `${reaction.message.channel}`, inline: true },
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Reported by', value: `${user}`, inline: true },
                        { name: 'Remaining cards this month', value: `${cardAllowance.cardAllowance}`, inline: true },
                        //{ name: '\u200B', value: '\u200B' },
                        { name: 'Link', value: `https://discordapp.com/channels/${reaction.message.guild.id}/${reaction.message.channel.id}/${reaction.message.id}` }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Mostly-Palatable Premier Division' });

                // Define a confirmation filter that only the approver ID can activate (Adam)
                const confirmFilter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && (user.id === getApproverId || user.id === getAdminId); // hard-coded my User ID to override
                };

                getRedCardChannel.send({ embeds: [cardEmbed] })
                    .then(message => {
                        // Send message
                        console.log('<RedCardTracker> Message sent to Channel');

                        // Add checkmark emoji for appprover to confirm
                        message.react('✅')
                            .then(() => {
                                message.react('❌');
                                console.log('<RedCardTracker> Confirmation buttons added');

                                // Add user data to cards.json if they don't exist
                                if (!cards[reaction.message.author.id]) cards[reaction.message.author.id] = {
                                    username: reaction.message.author.username,
                                    provisional: 0,
                                    confirmed: 0,
                                    cardAllowance: monthlyCards,
                                    monthReset: month
                                };

                                // Increment the value of provisional cards and write to the JSON file
                                const cardData = cards[reaction.message.author.id];
                                cardData.provisional++;

                                // Write to file - this writes the removal of a card from the reactor and the addition of a provisonal card to the accused
                                fs.writeFileSync(cardsPath, JSON.stringify(cards), (err) => {
                                    if (err) console.error(err);
                                });
                            });

                        // Await a reaction to the message from the filter (approver and approved emotes)
                        message.awaitReactions({ filter: confirmFilter, max: 1 })
                            .then(collected => {
                                const approvalReaction = collected.first();
                                // In here, write what we want to do when Adam confirms the card
                                // If Green, else if Red...
                                if (approvalReaction.emoji.name === '✅') {
                                    // If accepted, increment the counter for approved and remove a provisional 
                                    message.react('🟥');
                                    console.log('<RedCardTracker> Approved');
                                    console.log(`<RedCardTracker> ${reaction.message.author.tag}'s message "${reaction.message.content}" gained a confirmed red card!`);

                                    // Add one to confirmed value and take away a provisional card
                                    const cardData = cards[reaction.message.author.id];
                                    cardData.confirmed++;
                                    cardData.provisional--;

                                    // Write to file - this adds a confirmed red card and removes a provisional
                                    fs.writeFileSync(cardsPath, JSON.stringify(cards), (err) => {
                                        if (err) console.error(err);
                                    });

                                } else {
                                    // If rejected, delete the message
                                    console.log('<RedCardTracker> Rejected');
                                    console.log(`<RedCardTracker> ${reaction.message.author.tag}'s message "${reaction.message.content}" did not gain a confirmed red card`);
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
            }
        } else if (reaction.message.author.bot && !user.bot) {
            console.log(`<RedCardTracker> Not registering card as it was added to a bot`);

            // Remove the reaction from the bot
            reaction.remove().catch(error => console.error('Failed to remove reactions: ', error));
        } else if (reaction.message.author.bot && user.bot) {
            // This route is if the message reaction is on a bot's post, by a bot
            // Need this because bot reacts with a red card if a post is confirmed
            console.log(`<RedCardTracker> Bot has added a red card to a post.`);
        }
        else {
            console.log(`<RedCardTracker> Reaction count is ${reaction.count} - no need to post again`);
        }
    }
}

module.exports.redCardTrackerFunction = redCardTrackerFunction;