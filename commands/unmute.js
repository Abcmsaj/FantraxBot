module.exports = {
    name: 'unmute',
    description: 'Check if a user is muted, and if so, unmute them',
    execute(message, args) {
        // Declare the mute role
        const muteRole = message.guild.roles.cache.find(role => role.name === "mute");

        // Only run if the sender of the message is an admin
        if (message.member.permissions.has('ADMINISTRATOR')) {
            // If the role doesn't exist, tell user to make it
            if (!muteRole) {
                console.log('<Unmute> Mute role does not exist');
                message.channel.send(`Please create a role called 'mute' with no message send permissions.`);
                return;
            } else {
                // If it does exist, get the mentioned member
                console.log('<Unmute> Mute role exists');
                const member = message.mentions.members.first();
                // If member has the mute role, remove the role
                if (member.roles.cache.some(role => role.name === 'mute')) {
                    const member = message.mentions.members.first();
                    member.roles.remove(muteRole).then(() => {
                        message.channel.send(`${member} is now unmuted.`);
                        console.log(`<Unmute> ${member.user.username} is now unmuted.`);
                    });
                } else {
                    // Otherwise say that the role was never added
                    message.channel.send(`${member} is already unmuted.`);
                    console.log(`<Unmute> ${member.user.username} is already unmuted.`);
                }
            }
        } else {
            console.log('<Unmute> Non-admin user tried to execute mute command');
        }
    },
};