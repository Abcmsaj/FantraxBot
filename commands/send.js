const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'send',
    description: 'Command, channel name, message to be sent as the bot',
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('this is a test command!')
        .addStringOption((option) => option
            .setName('channel')
            .setDescription('Name of command to send a message to')
            .setRequired(true))
        .addStringOption((option) => option
            .setName('message')
            .setDescription('Message you wish to send to the channel')
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        // Declare channel, message, and find channel to send to
        const channelName = interaction.options.getString('channel');
        const messageToSend = interaction.options.getString('message');
        const sendingChannel = interaction.guild.channels.cache.find(channel => channel.name === channelName);

        // Send the message to the channel
        sendingChannel.send(messageToSend);
        console.log(`<Send> Bot sent: '${messageToSend}' to #${sendingChannel.name}`);

        // No reply needed
        interaction.deferReply();
        interaction.deleteReply();
    }
};