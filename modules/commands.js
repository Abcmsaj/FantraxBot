// Define client
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions] });

// Define fs
const fs = require('fs');

// Import commands from folder
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
    console.log(`<Commands> ${JSON.stringify(command)}`);
};

function commandsFunction(message, getPrefix) {
    if (!message.content.startsWith(getPrefix) || message.author.bot) return;

    const args = message.content.slice(getPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // command can be any casing

    if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
}

module.exports.commandsFunction = commandsFunction;