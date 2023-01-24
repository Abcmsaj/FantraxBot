const Discord = require('discord.js');
const checkFile = require('./modules/checkFile.js');
const reactFunction = require('./modules/reactions.js');
const memeFunction = require('./modules/memes.js');
const commandsFunction = require('./modules/commands.js');
const redCardTrackerFunction = require('./modules/redCardTracker.js');
const ssnTrackerFunction = require('./modules/ssnTracker.js');
const { prefix, token, redCardChannel, approverId, adminId, monthlyCards } = require('./FantraxConfig/config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions] });
const getPrefix = prefix;  // Get Prefix
const fs = require('fs');

//Create files if they don't exist
checkFile.checkFile('cards.json');
checkFile.checkFile('reacts.json');
checkFile.checkFile('ssn.json');
checkFile.checkFile('ssnGiver.json');
checkFile.checkFile('memes.json');

// ----------------
// Get a list of all command names
// ----------------
const commandNames = fs.readdirSync('./commands').filter((fileName) => fileName.endsWith('.js'));
const commands = {};

for (const commandName of commandNames) {
    const command = require(`./commands/${commandName}`);
    commands[command.data.name] = command;
}

// Login
client.login(token);

// ----------------
// Ready
// ----------------
client.once('ready', () => {
    console.log('Ready!');

    const adminChannel = client.channels.cache.find(channel => channel.name === 'commands'); // Admin channel
    adminChannel.send('Online!');

    // ----------------
    // Use the command names to create the slash commands
    // ----------------
    for (command in commands) {
        client.application.commands.create(commands[command].data);
    }
});

// ----------------
// Only reply to commands
// ----------------
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands[interaction.commandName];

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
    }
});

// -----------------------------------------------------
// Send messages based on triggers from Reacts JSON file
// -----------------------------------------------------
client.on('messageCreate', message => {
    reactFunction.reactFunction(message);
});

// -----------------------------------------------------
// Send memes randomly from the Memes JSON file
// -----------------------------------------------------
client.on('messageCreate', message => {
    memeFunction.memeFunction(message);
});

// ---------------------------------
// Send responses based on !commands
// ---------------------------------
client.on('messageCreate', message => {
    commandsFunction.commandsFunction(message, getPrefix);
});

// --------------------------------------------------------------------
// Message Reaction Add - SSN and Red Card Tracker
// --------------------------------------------------------------------
client.on('messageReactionAdd', async (reaction, user) => {
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

    // Get Red Card Channel
    const getRedCardChannel = client.channels.cache.get(redCardChannel);

    // Get ApproverId and AdminId
    const getApproverId = approverId;
    const getAdminId = adminId;

    redCardTrackerFunction.redCardTrackerFunction(Discord, reaction, getRedCardChannel, getApproverId, getAdminId, user, monthlyCards);

    ssnTrackerFunction.ssnTrackerFunction(reaction, user);
});
