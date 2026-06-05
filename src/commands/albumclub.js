const { SlashCommandBuilder } = require('@discordjs/builders');
const { forceStartAlbumClubRound, forceFinalizeAlbumClubRounds, getAlbumClubStatus } = require('../modules/albumClub');

module.exports = {
    name: 'albumclub',
    description: 'Manage the album club flow',
    data: new SlashCommandBuilder()
        .setName('albumclub')
        .setDescription('Manage the album club flow')
        .addSubcommand(subcommand => subcommand
            .setName('start')
            .setDescription('Pick the next album club user and start a new round'))
        .addSubcommand(subcommand => subcommand
            .setName('finalise')
            .setDescription('Check due album club polls and write results to history'))
        .addSubcommand(subcommand => subcommand
            .setName('status')
            .setDescription('Show the recent, pending, and finished album club state')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true });

        try {
            if (subcommand === 'start') {
                const result = await forceStartAlbumClubRound(interaction.client);
                if (!result) {
                    return interaction.editReply('No eligible members were found.');
                }
                return interaction.editReply(`Started a new round for ${result.selectedMember.user.tag}.`);
            }

            if (subcommand === 'finalise') {
                await forceFinalizeAlbumClubRounds(interaction.client);
                return interaction.editReply('Checked pending album club rounds.');
            }

            if (subcommand === 'status') {
                const status = getAlbumClubStatus();
                const recent = (status.recent.users || []).join(', ') || 'none';
                const pending = (status.pending.items || []).map(item => `${item.artist} - ${item.album}`).join('\n') || 'none';

                return interaction.editReply([
                    `Recent user IDs: ${recent}`,
                    '',
                    `Pending rounds:\n${pending}`,
                ].join('\n'));
            }

            return interaction.editReply('Unknown subcommand.');
        } catch (err) {
            console.error('<AlbumClub> Command failed:', err);
            return interaction.editReply('Album club failed. Check the logs.');
        }
    },
};
