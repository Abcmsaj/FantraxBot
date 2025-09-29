const Discord = require('discord.js');
const checkFile = require('./modules/checkFile.js');
const cron = require('node-cron');
const reactFunction = require('./modules/reactions.js');
const redCardTrackerFunction = require('./modules/redCardTracker.js');
const ssnTrackerFunction = require('./modules/ssnTracker.js');
const joyTrackerFunction = require('./modules/joyTracker.js');
const joyResponderFunction = require('./modules/joyTracker.js');
const birthdayCheckerFunction = require('./modules/birthdayChecker.js');
const fixSocialsFunction = require('./modules/fixSocials.js');
const createLineupChecker = require('./modules/lineupChecker');
const { token, redCardChannel, approverId, adminId, monthlyCards, guildId } = require('./FantraxConfig/config.json');
const client = new Discord.Client({
        intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers
    ],
    partials: [
        Discord.Partials.Message,
        Discord.Partials.Channel,
        Discord.Partials.Reaction,
        Discord.Partials.User,
        Discord.Partials.GuildMember
    ]
});
const fs = require('fs');

// Create files if they don't exist
checkFile.checkFile('json/birthdays.json');
checkFile.checkFile('json/cards.json');
checkFile.checkFile('json/reacts.json');
checkFile.checkFile('json/ssn.json');
checkFile.checkFile('json/ssnGiver.json');
checkFile.checkFile('json/memes.json');
checkFile.checkFile('json/joy.json');

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
    // Uncomment to delete all commands from the bot and guild
    const guild = client.guilds.cache.get(guildId);
    // client.application.commands.set([]);
    // guild.commands.set([]);

    // ----------------
    // Use the command names to create the slash commands
    // ----------------
    for (command in commands) {
        client.application.commands.create(commands[command].data);
        console.log(`<Commands> ${command} created`);
    }

    console.log('Ready!');

    const adminChannel = client.channels.cache.find(channel => channel.name === 'commands'); // Admin channel
    adminChannel.send('Online!');

    createLineupChecker(client);
});

// ----------------
// Enable slash commands
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

// ----------------
// Listen for Select Menu responses (joyReact)
// ----------------
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'joy') {
        joyResponderFunction.joyResponderFunction(interaction, interaction.values[0]);
    }
});

// -----------------------------------------------------
// Trigger function at midnight, every night
// -----------------------------------------------------
cron.schedule('00 00 * * *', () => {
    birthdayCheckerFunction.birthdayCheckerFunction(client);

    createLineupChecker(client);
});

// -----------------------------------------------------
// Send messages based on triggers from Reacts JSON file
// -----------------------------------------------------
client.on('messageCreate', (message) => {
    reactFunction.reactFunction(message);
});

// -----------------------------------------------------
// Check to see if a message has a Twitter/X link and replace it with fxtwitter
// -----------------------------------------------------
client.on('messageCreate', (message) => {
    // Check if the message contains any Twitter/X URLs to modify
    if (message && !message.author.bot && message.content && message.content.match(/(https:\/\/(?:www\.)?(x\.com|twitter\.com))/)) {
        // When tiktok/ig/reddit works, use (/(https:\/\/(?:www\.)?(x\.com|twitter\.com|instagram\.com|reddit\.com|vm\.tiktok\.com|tiktok\.com))/)
        fixSocialsFunction.fixSocialsFunction(message);
    }
});

// --------------------------------------------------------------------
// Message Reaction Add - SSN and Red Card Tracker
// --------------------------------------------------------------------
client.on('messageReactionAdd', async (reaction, user) => {
    // Pull in partial messages from before the bot was active
    try {
        if (reaction.partial) await reaction.fetch();
        if (user.partial) await user.fetch();
    } catch (error) {
        console.error('Failed to fetch partial reaction or user:', error);
        return;
    }

    // Get Red Card Channel
    const getRedCardChannel = client.channels.cache.get(redCardChannel);

    // Get ApproverId and AdminId
    const getApproverId = approverId;
    const getAdminId = adminId;

    redCardTrackerFunction.redCardTrackerFunction(Discord, reaction, getRedCardChannel, getApproverId, getAdminId, user, monthlyCards);

    ssnTrackerFunction.ssnTrackerFunction(reaction, user);

    joyTrackerFunction.joyTrackerFunction(reaction, user);
});
