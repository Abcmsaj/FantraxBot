// Define client
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions] });
const { SlashCommandBuilder } = require('@discordjs/builders');

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
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Provide a command name and this will reload the command to use its latest code')
        .addStringOption((option) => option
            .setName('command')
            .setDescription('Name of command to reload')
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        const commandName = interaction.options.getString('command').toLowerCase();
        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            console.log(`<Reload> There is no command called ${commandName}`);
            return interaction.reply(`There is no command with name or alias \`${commandName}\`, ${interaction.user}!`);
        }

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
            const newCommand = require(`./${command.name}.js`);
            client.commands.set(newCommand.name, newCommand);
            interaction.reply(`Command \`${command.name}\` was reloaded!`);
            console.log(`<Reload> Command ${command.name} was reloaded by ${interaction.user.username}!`);
        } catch (error) {
            console.log(`<Reload> ${error}`);
            interaction.reply(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }
    },
};