const { EmbedBuilder } = require('discord.js');
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
            const embed = new EmbedBuilder()
                .setTitle('📊 Poll')
                .setDescription(question)
                .setColor(embedColor)
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.reply({ embeds: [embed] });
            const msg = await interaction.fetchReply();

            await msg.react('👍');
            await msg.react('👎');

            console.log(`<Poll> Yes/No poll by ${interaction.user.username}: '${question}' in the ${interaction.channel.name} channel`);
        } else {
            const embed = new EmbedBuilder();

            let optionsArr = options.split(separator);

            const alphabet = [
                '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯',
                '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'
            ];

            if (optionsArr.length > alphabet.length) {
                return interaction.reply({ content: "Please don't input more than 20 options.", ephemeral: true });
            }

            optionsArr = optionsArr.map((opt, i) => `${alphabet[i]} ${opt.trim()}`);

            const arr = [question, ...optionsArr];

            embed
                .setDescription(arr.join('\n\n'))
                .setColor(embedColor)
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL()
                });

            await interaction.reply({ embeds: [embed] });
            const msg = await interaction.fetchReply();

            for (let i = 0; i < optionsArr.length; i++) {
                await msg.react(alphabet[i]);
            }

            console.log(`<Poll> Multi choice poll created by ${interaction.user.username}: '${question}' in the ${interaction.channel.name} channel`);
        }
    },
};
