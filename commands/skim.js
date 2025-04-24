const { SlashCommandBuilder } = require('@discordjs/builders');
const { chromium } = require('playwright');

async function skim(interaction) {
    const cmd = interaction.options.getString('service');
    const query = interaction.options.getString('query');

    const waitingMessage = await interaction.deferReply({ fetchReply: true });
    await processMessage(cmd, query, interaction, waitingMessage);
}

async function processMessage(cmd, query, interaction, waitingMessage) {
    console.log(`<Skim> [${new Date().toLocaleString()}] ${interaction.user.username} invoked command: ${interaction}`);

    switch (cmd) {
        case "help":
        case "h":
            await interaction.editReply({
                embeds: [{
                    title: "Commands",
                    description:
                        "\n`/skim screenshot <url>`" +
                        "\n`/skim screenshotf <url>`" +
                        "\n`/skim google <query>`" +
                        "\n`/skim google-im-feeling-lucky <query>`" +
                        "\n`/skim google-images <query>`" +
                        "\n`/skim wikipedia <query>`" +
                        "\n`/skim wikipediaf <query>`" +
                        "\n Each command has an abbreviated version." +
                        "\n"
                }]
            });
            return;

        case "screenshot":
        case "ss":
            await takeScreenshot(getHttpUrl(query), false, cmd, query, interaction, waitingMessage);
            break;
        case "screenshotf":
        case "ssf":
            await takeScreenshot(getHttpUrl(query), true, cmd, query, interaction, waitingMessage);
            break;
        case "google":
        case "g":
            await takeScreenshot(`https://www.google.com/search?q=${encodeURIComponent(query)}`, false, cmd, query, interaction, waitingMessage);
            break;
        case "google-im-feeling-lucky":
        case "gifl":
            await takeScreenshot(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, true, cmd, query, interaction, waitingMessage);
            break;
        case "google-images":
        case "gi":
            await takeScreenshot(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=on`, false, cmd, query, interaction, waitingMessage);
            break;
        case "wikipedia":
        case "w":
            await takeScreenshot(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(query)}`, false, cmd, query, interaction, waitingMessage);
            break;
        case "wikipediaf":
        case "wf":
            await takeScreenshot(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(query)}`, true, cmd, query, interaction, waitingMessage);
            break;
    }
}

function getHttpUrl(query) {
    return (query.startsWith("http://") || query.startsWith("https://")) ? query : `http://${query}`;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(url, fullPage, cmd, query, interaction, waitingMessage) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await waitingMessage.react('🆗');

    try {
        await page.setViewportSize({ width: 1440, height: 900 });

        const isTwitter = url.includes("twitter.com");
        await page.goto(url, { waitUntil: isTwitter ? 'networkidle' : 'load' });

        if (url.startsWith('https://duckduckgo.com/')) {
            await delay(2000);
        }

        if (url.includes('google.com')) {
            const button = await page.locator('button:has-text("Accept")');
            if (await button.count() > 0) await button.first().click();
        }

        const screenshot = await page.screenshot({ type: 'png', fullPage });
        await interaction.editReply({
            content: `**Skimmed:**\n\`${query} using ${cmd}\``,
            files: [{ attachment: screenshot, name: 'screenshot.png' }]
        });

        await waitingMessage.reactions.removeAll();
    } catch (err) {
        console.error(err);
        await interaction.editReply(`:warning: ${err.message}`);
    } finally {
        await browser.close();
        console.log('<Skim> Chromium closed');
    }
}

module.exports = {
    name: 'skim',
    description: 'Skims a website and produces a screenshot to be posted into Discord',
    data: new SlashCommandBuilder()
        .setName('skim')
        .setDescription('Skims a website and produces a screenshot from the query created')
        .addStringOption((option) => option
            .setName('service')
            .setDescription('The service you want to use to use for the skim (i.e. g, gi, ss, w)')
            .setRequired(true))
        .addStringOption((option) => option
            .setName('query')
            .setDescription('The query you want to search, or URL if you provided ss as the service')
            .setRequired(true)),
    async execute(interaction) {
        await skim(interaction);
    }
};
