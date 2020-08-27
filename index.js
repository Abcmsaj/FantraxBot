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

// Create date
var today = new Date();
var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date + ' ' + time;

client.once('ready', () => {
    console.log('Ready!');

});

// ---------------------------------
// Send responses based on messages
// ---------------------------------
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // command can be any casing

    if (!client.commands.has(command)) return;

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
        } else {
            console.log(`Reaction count is ${reaction.count} - no need to post again`);
        }
    } else {
        return 0;
    }

});