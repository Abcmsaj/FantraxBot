const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { ContextMenuCommandBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require('discord.js');

const memesPath = path.join(__dirname, '../json/memes.json');
const memesDir = path.join(__dirname, '../images/memes');

// Ensure memes.json exists
let memes = {};
try {
    memes = JSON.parse(fs.readFileSync(memesPath, 'utf8'));
} catch { }

async function downloadImage(url, outPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download image');
    const fileStream = fs.createWriteStream(outPath);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on('end', resolve);
        res.body.on('error', reject);
    });
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add Meme')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        console.log(`<AddMeme> ${interaction.user.username} invoked 'Add Meme' in #${interaction.channel.name}`);

        const targetMessage = interaction.targetMessage;

        if (!targetMessage) {
            console.log(`<AddMeme> Failed: No target message found.`);
            interaction.reply({ content: 'Reply to a message with an image.', ephemeral: true });
            return;
        }

        const attachment = targetMessage.attachments.first();
        if (!attachment || !attachment.contentType?.startsWith('image')) {
            console.log(`<AddMeme> Failed: Target message has no image attachment.`);
            interaction.reply({ content: 'The target message does not contain an image.', ephemeral: true });
            return;
        }

        // Get next ID
        const lastKey = Object.keys(memes).pop() || '0';
        const newKey = String(parseInt(lastKey) + 1);

        const ext = path.extname(attachment.name || '.jpg');
        const filename = `${newKey}${ext}`;
        const fullPath = path.join(memesDir, filename);

        try {
            await downloadImage(attachment.url, fullPath);
            console.log(`<AddMeme> Image downloaded successfully: ${filename}`);
        } catch (err) {
            console.error(`<AddMeme> Error downloading image: ${err.message}`);
            interaction.reply({ content: "Couldn't download the image.", ephemeral: true });
            return;
        }

        // Default NSFW false
        memes[newKey] = {
            file: filename,
            nsfw: false
        };
        fs.writeFileSync(memesPath, JSON.stringify(memes, null, 2));
        console.log(`<AddMeme> Meme #${newKey} metadata saved to memes.json`);

        // Post to meme-library channel
        const memeLibraryCh = interaction.guild.channels.cache.find(channel => channel.name === 'meme-library');
        if (!memeLibraryCh) {
            console.log(`<AddMeme> Warning: 'meme-library' channel not found.`);
            interaction.reply({ content: 'Meme library channel not found.', ephemeral: true });
            return;
        }

        const memeAttachment = new AttachmentBuilder(fullPath);
        await memeLibraryCh.send({ content: `Meme #${newKey}`, files: [memeAttachment] });
        console.log(`<AddMeme> Meme #${newKey} posted to #meme-library`);

        // Ask if NSFW
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

        await interaction.reply({
            content: `Meme #${newKey} added! Do you want to mark it as NSFW?`,
            components: [row],
            flags: MessageFlags.Ephemeral
        });

        // Listen for button presses *only for this interaction*
        const filter = i => i.customId.endsWith(`_${newKey}`) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000 });

        collector.on('collect', async i => {
            const isYes = i.customId.startsWith('nsfw_yes');
            memes[newKey].nsfw = isYes;
            fs.writeFileSync(memesPath, JSON.stringify(memes, null, 2));

            console.log(`<AddMeme> NSFW status for Meme #${newKey} set to: ${isYes} by ${i.user.username}`);

            const status = isYes ? 'Marked as NSFW ✅' : 'Not marked as NSFW ❌';
            await i.update({ content: status, components: [] });
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                console.log(`<AddMeme> No NSFW selection made for Meme #${newKey}. Defaulting to false.`);
                interaction.editReply({ content: 'No NSFW selection made. Meme added with default NSFW: false.', components: [] });
            }
        });
    }
};