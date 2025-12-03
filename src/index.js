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
const { token, redCardChannel, approverId, adminId, monthlyCards } = require('../FantraxConfig/config.json');
const path = require('path');
const fs = require('fs');

// --------------------
// Client
// --------------------
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

// Helper for full paths inside src
const srcPath = (dir) => path.join(__dirname, dir);

// --------------------
// Ensure JSON files exist
// --------------------
[
    'birthdays.json',
    'cards.json',
    'reacts.json',
    'ssn.json',
    'ssnGiver.json',
    'memes.json',
    'joy.json'
].forEach(file => checkFile.checkFile(srcPath(`json/${file}`)));

// --------------------
// Load commands
// --------------------
const commandFiles = fs.readdirSync(srcPath('commands')).filter(f => f.endsWith('.js'));
const commands = {};

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (!command.name && !command.data) {
        console.warn(`<Commands> Skipping ${file}: missing name or data`);
        continue;
    }
    commands[command.name || command.data?.name] = command;
}

// --------------------
// Login
// --------------------
client.login(token);

// --------------------
// Ready
// --------------------
client.once('ready', () => {
    console.log('Ready!');

    const adminChannel = client.channels.cache.find(ch => ch.name === 'commands');
    if (adminChannel) adminChannel.send('Online!');

    createLineupChecker(client);
});

// --------------------
// Interaction handler
// --------------------
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand() || interaction.isContextMenuCommand()) {
            const command = commands[interaction.commandName];
            if (!command) return;

            await command.execute(interaction);
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'joy') {
            joyResponderFunction.joyResponderFunction(interaction, interaction.values[0]);
        }
    } catch (err) {
        console.error('Interaction error:', err);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'An error occurred.', flags: Discord.MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'An error occurred.', flags: Discord.MessageFlags.Ephemeral });
        }
    }
});

// --------------------
// Cron jobs
// --------------------
cron.schedule('0 0 * * *', () => {
    birthdayCheckerFunction.birthdayCheckerFunction(client);
    createLineupChecker(client);
});

// --------------------
// Message create events
// --------------------
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // React triggers
    reactFunction.reactFunction(message);

    // Fix Twitter/X links
    if (message.content.match(/https:\/\/(?:www\.)?(x\.com|twitter\.com)/)) {
        fixSocialsFunction.fixSocialsFunction(message);
    }
});

// --------------------
// Reaction add events
// --------------------
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (reaction.partial) await reaction.fetch();
        if (user.partial) await user.fetch();
    } catch (err) {
        console.error('Failed to fetch partial:', err);
        return;
    }

    const redCardCh = client.channels.cache.get(redCardChannel);
    redCardTrackerFunction.redCardTrackerFunction(Discord, reaction, redCardCh, approverId, adminId, user, monthlyCards);
    ssnTrackerFunction.ssnTrackerFunction(reaction, user);
    joyTrackerFunction.joyTrackerFunction(reaction, user);
});
