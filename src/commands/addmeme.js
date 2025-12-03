const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const path = require('path');
const fetch = require('node-fetch');
const { ContextMenuCommandBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');

const memesPath = path.join(__dirname, '../json/memes.json');
const memesDir = path.join(__dirname, '../images/memes');

async function downloadImage(url, outPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    await pipeline(res.body, createWriteStream(outPath));
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add Meme')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        const targetMessage = interaction.targetMessage;
        const attachment = targetMessage?.attachments.first();

        if (!attachment || !attachment.contentType?.startsWith('image')) {
            return interaction.reply({ content: 'Please target a message with an image.', ephemeral: true });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // 1. Ensure directory and file exist
            await fs.mkdir(memesDir, { recursive: true });
            let memes = {};
            try {
                const data = await fs.readFile(memesPath, 'utf8');
                memes = JSON.parse(data);
            } catch (e) { /* File likely doesn't exist yet, empty obj is fine */ }

            // 2. ID Logic
            const lastKey = Object.keys(memes).pop() || '0';
            const newKey = String(parseInt(lastKey) + 1);

            const ext = path.extname(attachment.name || '.jpg');
            const filename = `${newKey}${ext}`;
            const fullPath = path.join(memesDir, filename);

            // 3. Download
            await downloadImage(attachment.url, fullPath);

            // 4. Save DB (Non-blocking)
            memes[newKey] = { file: filename, nsfw: false };
            await fs.writeFile(memesPath, JSON.stringify(memes, null, 2));

            // 5. Post to Library
            const channel = interaction.guild.channels.cache.find(c => c.name === 'meme-library');
            if (channel) {
                await channel.send({
                    content: `Meme #${newKey}`,
                    files: [new AttachmentBuilder(fullPath)]
                });
            }

            // 6. NSFW Prompt
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`nsfw_yes_${newKey}`).setLabel('Yes').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`nsfw_no_${newKey}`).setLabel('No').setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({
                content: `Meme #${newKey} added! Mark as NSFW?`,
                components: [row]
            });

            // Handle Buttons
            const filter = i => i.customId.endsWith(`_${newKey}`) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const isYes = i.customId.startsWith('nsfw_yes');
                if (isYes) {
                    // Re-read -> Update -> Write (Concurrency safe-ish)
                    const currentData = JSON.parse(await fs.readFile(memesPath, 'utf8'));
                    if (currentData[newKey]) {
                        currentData[newKey].nsfw = true;
                        await fs.writeFile(memesPath, JSON.stringify(currentData, null, 2));
                    }
                }
                await i.update({ content: isYes ? 'Marked NSFW 🔞' : 'Saved (SFW) ✅', components: [] });
                collector.stop();
            });

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: 'Failed to save meme.' });
        }
    }
};