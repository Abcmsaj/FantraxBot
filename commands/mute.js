const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'mute',
    description: 'Provide a username and time in minutes for the user to be timeout out for',
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Will time out a user for the specified time (in seconds)')
        .addUserOption((option) => option
            .setName('user')
            .setDescription('The user that will be timed out')
            .setRequired(true))
        .addNumberOption((option) => option
            .setName('duration')
            .setDescription('How long the timeout will last (in seconds)')
            .setRequired(true))
        .addStringOption((option) => option
            .setName('reason')
            .setDescription('The reason for the timeout (optional)')
            .setMaxLength(512)
            .setRequired(false))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const timeout = interaction.options.getNumber('duration');
        const reason = interaction.options.getString('reason') || 'no reason';
        const convertTimeoutToMs = timeout * 1000;

        member.timeout(convertTimeoutToMs).then(() => {
            interaction.reply(`${member} is now muted for ${timeout} seconds for ${reason}.`);
            console.log(`<Mute> ${member.user.username} is now muted for ${timeout} seconds for ${reason}.`);
        });
    }
};