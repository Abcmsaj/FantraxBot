const Discord = require('discord.js');
const checkFile = require('./checkFile.js');
const reactFunction = require('./modules/reactions.js');
const commandsFunction = require('./modules/commands.js');
const redCardTrackerFunction = require('./modules/redCardTracker.js');
const ssnTrackerFunction = require('./modules/ssnTracker.js')
const fs = require('fs');
const { prefix, token, redCardChannel, approverId } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

//Create files if they don't exist
checkFile.checkFile('cards.json')
checkFile.checkFile('ssn.json')
checkFile.checkFile('reacts.json')

// Login
client.login(token);

// Create date
var today = new Date();
var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
var dateTime = date + ' ' + time;

// ----------------
// Ready
// ----------------
client.once('ready', () => {
    console.log('Ready!');

});

// -----------------------------------------------------
// Send messages based on triggers from Reacts JSON file
// -----------------------------------------------------
client.on('message', message => {
    reactFunction.reactFunction(message, fs);
});

// ---------------------------------
// Send responses based on !commands
// ---------------------------------
client.on('message', message => {
    // Get Prefix
    const getPrefix = prefix;

    commandsFunction.commandsFunction(message, getPrefix);
});

// --------------------------------------------------------------------
// Message Reaction Add - SSN and Red Card Tracker
// --------------------------------------------------------------------
client.on('messageReactionAdd', async (reaction) => {
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
    const getRedCardChannel = client.channels.cache.get(redCardChannel)

    // Get ApproverId
    const getApproverId = approverId

    redCardTrackerFunction.redCardTrackerFunction(Discord, reaction, getRedCardChannel, getApproverId, fs, dateTime);

    ssnTrackerFunction.ssnTrackerFunction(reaction, fs, dateTime)

});