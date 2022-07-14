const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

module.exports = {
    name: 'mute',
    description: 'Check if a user is unmuted, and if so, mute them',
    execute(message, args) {
        // Declare the mute role
        const muteRole = message.guild.roles.cache.find(role => role.name === "mute");

        // Only run if the sender of the message is an admin
        if (message.member.permissions.has('ADMINISTRATOR')) {
            // If guild doesn't have a mute role, tell the channel to make it
            if (!muteRole) {
                console.log('Mute role does not exist');
                message.channel.send(`Please create a role called 'mute' with no message send permissions.`);
                return;
            } else {
                // if mute role exists, get the first mentioned user
                console.log('Mute role exists');
                const member = message.mentions.members.first();
                // If they don't already have the mute role, give it to them
                if (!member.roles.cache.some(role => role.name === 'mute')) {
                    const member = message.mentions.members.first();
                    member.roles.add(muteRole).then(() => {
                        message.channel.send(`${member} is now muted.`);
                        console.log(`${member} is now muted.`);
                    });
                    // Otherwise, tell the channel that the user has the role
                } else {
                    console.log('User already has the mute role');
                    message.channel.send(`${member} is already muted.`);
                    console.log(`${member} is already muted.`);
                }
            }
        } else {
            console.log('Non-admin user tried to execute mute command');
        }
    },
};