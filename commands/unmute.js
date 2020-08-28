module.exports = {
    name: 'unmute',
    description: 'Check if a user is muted, and if so, unmute them',
    execute(message, args) {
        // Declare the mute role
        const muteRole = message.guild.roles.cache.find(role => role.name === "mute");

        // Only run if the sender of the message is an admin
        if (message.member.hasPermission("ADMINISTRATOR")) {
            // If the role doesn't exist, tell user to make it
            if (!muteRole) {
                console.log('Mute role does not exist')
                message.channel.send(`Please create a role called 'mute' with no message send permissions.`)
                return;
            } else {
                // If it does exist, get the mentioned member
                console.log('Mute role exists')
                const member = message.mentions.members.first();
                // If member has the mute role, remove the role
                if (member.roles.cache.some(role => role.name === 'mute')) {
                    const member = message.mentions.members.first();
                    member.roles.remove(muteRole).then(() => {
                        message.channel.send(`${member} is now unmuted.`)
                        console.log(`${member} is now unmuted.`)
                    })
                } else {
                    // Otherwise say that the role was never added
                    console.log('User is already unmuted')
                    message.channel.send(`${member} is already unmuted.`)
                    console.log(`${member} is already unmuted.`)
                }
            }
        } else {
            console.log('Non-admin user tried to execute mute command')
        }
    },
};