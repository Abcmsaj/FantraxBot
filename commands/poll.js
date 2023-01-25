const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'poll',
    description: 'Create a poll',
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a Yes/No poll, or provide options separated by + to add multiple choice')
        .addStringOption((option) => option
            .setName('question')
            .setDescription('The question to your poll')
            .setMaxLength(512)
            .setRequired(true))
        .addStringOption((option) => option
            .setName('options')
            .setDescription('Add options to a multiple choice poll, separated by a +')
            .setMaxLength(512)
            .setRequired(false)),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const options = interaction.options.getString('options');
        const embedColor = '#ffffff';
        const separator = '+';

        if (!options) {
            const embed = new Discord.EmbedBuilder()
                .setTitle('📊  Poll')
                .setDescription(question)
                .setColor(embedColor)
                .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ format: "png", dynamic: true }) });

            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

            msg.react('👍');
            msg.react('👎');

            console.log(`<Poll> Yes/No poll by ${interaction.user.username}: '${question}' in the ${interaction.channel.name} channel`);
        }

        else {
            // Declare the question and options from the slash command
            const embed = new Discord.EmbedBuilder();
            const question = interaction.options.getString('question');
            const options = interaction.options.getString('options');

            // Declare blank options array
            var optionsArr = [];

            // Declare alphabet emojis
            const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱',
                '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];

            // Split the options up by the separator character
            optionsArr = options.split(separator);

            // Add the question to the start of the options array (as all of this will be in the desc of the embed)
            const arr = [question].concat(optionsArr);

            // If more than 26 options, return error
            if (optionsArr.length > alphabet.length) {
                return interaction.reply(`Please don't input more than 26 options.`);
            }

            // Create the embed
            embed
                .setDescription(arr.join('\n\n'))
                .setColor(embedColor)
                .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ format: "png", dynamic: true }) });

            // Send message to channel and react with alphabet emojis
            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

            for (let i = 0; i < optionsArr.length; i++) {
                msg.react(alphabet[i]);
            }

            // Log to console
            console.log(`<Poll> Multi choice poll created by ${interaction.user.username}: '${question}' in the ${interaction.channel.name} channel`);
        }
    },
};