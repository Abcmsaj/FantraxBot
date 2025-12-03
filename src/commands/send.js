const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'send',
    description: 'Command, channel name, message to be sent as the bot',
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Will send a message to the specified channel, as the bot')
        .addStringOption((option) => option
            .setName('channel')
            .setDescription('Name of command to send a message to')
            .setRequired(true))
        .addStringOption((option) => option
            .setName('message')
            .setDescription('Message you want to send to the channel')
            .setRequired(true))
        .setDefaultMemberPermissions(0), // Admin only
    async execute(interaction) {
        // Declare channel, message, and find channel to send to
        const channelName = interaction.options.getString('channel');
        const messageToSend = interaction.options.getString('message');
        const sendingChannel = interaction.guild.channels.cache.find(channel => channel.name === channelName);

        // Send the message to the channel
        await sendingChannel.send(messageToSend);
        console.log(`<Send> Bot sent: '${messageToSend}' to #${sendingChannel.name}`);

        // No reply needed
       await interaction.reply({ content: `Message sent to #${sendingChannel.name}.`, ephemeral: true });
    }
};