const { REST, Routes } = require('discord.js');
const fs = require('fs');
const { token, guildId, clientId } = require('./FantraxConfig/config.json');

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        // --- Delete existing guild commands ---
        console.log('Fetching guild commands...');
        const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
        console.log(`Found ${guildCommands.length} guild commands. Deleting...`);
        for (const cmd of guildCommands) {
            await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
            console.log(`Deleted guild command: ${cmd.name}`);
        }

        // --- Load local commands ---
        const commandFiles = fs.readdirSync('./src/commands').filter(f => f.endsWith('.js'));
        const commands = [];

        for (const file of commandFiles) {
            const cmd = require(`./src/commands/${file}`);

            if (cmd.data) {
                // Slash command
                commands.push(cmd.data.toJSON());
            } else if (cmd.name && cmd.type) {
                // Context menu (user/message)
                commands.push({
                    name: cmd.name,
                    type: cmd.type
                });
            }
        }

        // --- Register all commands to the guild ---
        console.log(`Registering ${commands.length} guild commands...`);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('Successfully registered guild commands.');
    } catch (err) {
        console.error(err);
    }
})();
