const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const path = require('path');
const fetch = require('node-fetch');
const {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    MessageFlags
} = require('discord.js');

const memesPath = path.join(__dirname, '../json/memes.json');
const memesDir = path.join(__dirname, '../images/memes');

async function downloadImage(url, outPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    await pipeline(res.body, createWriteStream(outPath));
}

async function sendMemeToLibrary(interaction, fullPath, newKey, isNsfw) {
    const channel = interaction.guild.channels.cache.find(
        c => c.name === 'meme-library'
    );

    if (!channel) return;

    let fileName = path.basename(fullPath);

    // Mark as spoiler if NSFW so Discord blurs it
    if (isNsfw && !fileName.startsWith('SPOILER_')) {
        fileName = `SPOILER_${fileName}`;
    }

    const attachment = new AttachmentBuilder(fullPath, {
        name: fileName
    });

    await channel.send({
        content: `Meme #${newKey}`,
        files: [attachment]
    });
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add Meme')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        const targetMessage = interaction.targetMessage;
        const attachment = targetMessage?.attachments.first();

        if (!attachment || !attachment.contentType?.startsWith('image')) {
            return interaction.reply({
                content: 'Please target a message with an image.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // 1. Ensure directory and file exist
            await fs.mkdir(memesDir, { recursive: true });

            let memes = {};
            try {
                const data = await fs.readFile(memesPath, 'utf8');
                memes = JSON.parse(data);
            } catch (e) {
                // File doesn't exist yet, that's fine
            }

            // 2. Generate ID
            const lastKey = Object.keys(memes).pop() || '0';
            const newKey = String(parseInt(lastKey) + 1);

            const ext = path.extname(attachment.name || '.jpg');
            const filename = `${newKey}${ext}`;
            const fullPath = path.join(memesDir, filename);

            // 3. Download image
            await downloadImage(attachment.url, fullPath);

            // 4. Save initial DB entry (default SFW)
            memes[newKey] = { file: filename, nsfw: false };
            await fs.writeFile(memesPath, JSON.stringify(memes, null, 2));

            // 5. Ask NSFW question BEFORE sending to library
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`nsfw_yes_${newKey}`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`nsfw_no_${newKey}`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({
                content: `Meme #${newKey} added! Mark as NSFW?`,
                components: [row]
            });

            const reply = await interaction.fetchReply();

            const filter = i =>
                i.customId.endsWith(`_${newKey}`) &&
                i.user.id === interaction.user.id;

            const collector = reply.createMessageComponentCollector({
                filter,
                time: 10000
            });

            collector.on('collect', async i => {
                const isYes = i.customId.startsWith('nsfw_yes');

                const currentData = JSON.parse(
                    await fs.readFile(memesPath, 'utf8')
                );

                if (currentData[newKey]) {
                    currentData[newKey].nsfw = isYes;
                    await fs.writeFile(
                        memesPath,
                        JSON.stringify(currentData, null, 2)
                    );
                }

                await sendMemeToLibrary(
                    interaction,
                    fullPath,
                    newKey,
                    isYes
                );

                await i.update({
                    content: isYes
                        ? 'Marked NSFW 🔞'
                        : 'Saved (SFW) ✅',
                    components: []
                });

                collector.stop();
            });

            collector.on('end', async collected => {
                if (collected.size > 0) return;

                try {
                    await sendMemeToLibrary(
                        interaction,
                        fullPath,
                        newKey,
                        false
                    );

                    await interaction.editReply({
                        content: 'No response received. Defaulted to SFW ✅',
                        components: []
                    });
                } catch (err) {
                    console.error(err);
                }
            });

        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: 'Failed to save meme.',
                components: []
            });
        }
    }
};