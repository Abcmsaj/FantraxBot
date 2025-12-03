const fs = require("fs").promises;
const path = require("path");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { AttachmentBuilder } = require("discord.js");

const memesPath = path.join(__dirname, "../json/memes.json");
const memesDir = path.join(__dirname, "../images/memes");

module.exports = {
    name: "meme",
    description: "Send a meme",
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Send a meme by ID or random")
        .addNumberOption(o =>
            o.setName("number").setDescription("Meme ID").setRequired(false)
        ),
    cooldown: 10,

    async execute(interaction) {
        let memes = {};
        const inputNum = interaction.options.getNumber("number");

        // Log intent
        console.log(`<Meme> ${interaction.user.username} requested ${inputNum ? `ID: ${inputNum}` : 'Random'}`);

        // 1. NON-BLOCKING READ
        try {
            const data = await fs.readFile(memesPath, "utf8");
            memes = JSON.parse(data);
        } catch (err) {
            console.error(`<Meme> Error reading DB: ${err.message}`);
            return interaction.reply({ content: "Database error.", ephemeral: true });
        }

        let id;
        let randomPick = false;

        if (inputNum) {
            id = String(inputNum);
            if (!memes[id]) {
                return interaction.reply({ content: "No meme with that ID exists.", ephemeral: true });
            }
        } else {
            // 2. ROBUST RANDOM LOGIC
            // Instead of 1-Count, we pick from actual existing keys. 
            // This prevents errors if 'Meme #2' is deleted but still have 'Meme #3'.
            const keys = Object.keys(memes);
            if (keys.length === 0) return interaction.reply("No memes available.");

            id = keys[Math.floor(Math.random() * keys.length)];
            randomPick = true;
        }

        const meme = memes[id];
        const filePath = path.join(memesDir, meme.file);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            console.error(`<Meme> Missing file: ${filePath}`);
            return interaction.reply({ content: "Meme image file is missing.", ephemeral: true });
        }

        let fileName = meme.nsfw ? `SPOILER_${meme.file}` : meme.file;
        const attachment = new AttachmentBuilder(filePath, { name: fileName });
        const content = `${randomPick ? "🎲 " : ""}Meme #${id}`;

        await interaction.reply({ content, files: [attachment] });
        console.log(`<Meme> Sent meme #${id}`);
    }
};