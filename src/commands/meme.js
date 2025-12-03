const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { AttachmentBuilder } = require("discord.js");

const memesPath = path.join(__dirname, "../json/memes.json");
const memesDir = path.join(__dirname, "../images/memes");

// Function to get a random number between 1 and the max provided
function getRandomInt(max) {
    return Math.floor(Math.random() * max) + 1;
}

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

        // Log invocation
        const inputNum = interaction.options.getNumber("number");
        const requestType = inputNum ? `ID: ${inputNum}` : 'Random';
        console.log(`<Meme> ${interaction.user.username} requested meme (${requestType}) in #${interaction.channel.name}`);

        try {
            memes = JSON.parse(fs.readFileSync(memesPath, "utf8"));
        } catch (err) {
            console.error(`<Meme> Error: Failed to read memes.json: ${err.message}`);
            interaction.reply("No memes found.");
            return;
        }

        let id;
        let randomPick = false;

        if (inputNum) {
            id = String(inputNum);
            if (!memes[id]) {
                console.log(`<Meme> Failed: ID ${id} not found in database.`);
                interaction.reply("No meme with that ID exists.");
                return;
            }
        } else {
            const count = Object.keys(memes).length;
            id = String(getRandomInt(count));
            randomPick = true; // Mark that this was a random meme
        }

        const meme = memes[id];
        // Guard against meme object being undefined if something weird happened with ID generation
        if (!meme) {
            console.log(`<Meme> Failed: Generated ID ${id} does not exist in object keys.`);
            interaction.reply("Error finding meme.");
            return;
        }

        const filePath = path.join(memesDir, meme.file);

        if (!fs.existsSync(filePath)) {
            console.error(`<Meme> Error: File missing at path ${filePath}`);
            interaction.reply("Meme file missing.");
            return;
        }

        // Spoiler support
        let fileName = meme.file;
        if (meme.nsfw) {
            fileName = `SPOILER_${fileName}`;
        }

        const attachment = new AttachmentBuilder(filePath, { name: fileName });

        // Add dice emoji if meme was randomly selected
        const content = `${randomPick ? "🎲 " : ""}Meme #${id}`;

        await interaction.reply({
            content,
            files: [attachment]
        });

        console.log(`<Meme> Sent meme #${id} to ${interaction.user.username}`);
    }
};