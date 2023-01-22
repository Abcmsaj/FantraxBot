// Define client
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

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
};

module.exports = {
    name: 'reload',
    description: 'Reloads a command',
    args: true,
    execute(message, args) {
        if (!args[0]) {
            console.log(`<Reload> Reload args cannot by null`)
            return message.channel.send(`You need to provide a reload command name`);
        } else {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName)
                || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) {
                console.log(`<Reload> There is no command called ${commandName}`)
                return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
            }

            delete require.cache[require.resolve(`./${command.name}.js`)];

            try {
                const newCommand = require(`./${command.name}.js`);
                client.commands.set(newCommand.name, newCommand);
                message.channel.send(`Command \`${command.name}\` was reloaded!`);
                console.log(`<Reload> Command ${command.name} was reloaded by ${message.author.username}!`);
            } catch (error) {
                console.log(`<Reload> ${error}`);
                message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
            }
        }
    },
};