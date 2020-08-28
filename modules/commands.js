// Define client
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

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
    console.log(command)
};

// Add cooldowns
const cooldowns = new Discord.Collection();

function commandsFunction(message, getPrefix) {
    if (!message.content.startsWith(getPrefix) || message.author.bot) return;

    const args = message.content.slice(getPrefix.length).trim().split(/ +/);
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
}

module.exports.commandsFunction = commandsFunction;