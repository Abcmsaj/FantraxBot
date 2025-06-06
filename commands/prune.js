const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'prune',
    description: 'Prune up to 99 messages.',
    data: new SlashCommandBuilder()
        .setName('prune')
        .setDescription('Delete a set number of messages from 1-99')
        .addNumberOption((option) => option
            .setName('message_count')
            .setDescription('Number of messages to be removed')
            .setMinValue(1)
            .setMaxValue(99)
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        const numberToDelete = interaction.options.getNumber('message_count');

        // No reply needed
        interaction.deferReply().then(() => {
            interaction.deleteReply().then(() => {
                interaction.channel.bulkDelete(numberToDelete, true).catch(err => {
                    console.error(err);
                    interaction.reply('There was an error trying to prune messages in this channel!');
                });
            });
        })

        console.log(`<Prune> ${numberToDelete} messages removed by ${interaction.user.username} in #${interaction.channel.name}`);
    }
};