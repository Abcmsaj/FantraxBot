const { SlashCommandBuilder } = require('@discordjs/builders');
const { chromium } = require('playwright');
const { setTimeout } = require('timers/promises');

const SERVICES = {
    'screenshot': { url: (q) => getHttpUrl(q), fullPage: false },
    'ss': { url: (q) => getHttpUrl(q), fullPage: false },
    'screenshotf': { url: (q) => getHttpUrl(q), fullPage: true },
    'ssf': { url: (q) => getHttpUrl(q), fullPage: true },

    'google': { url: (q) => `https://www.google.com/search?q=${e(q)}`, fullPage: false },
    'g': { url: (q) => `https://www.google.com/search?q=${e(q)}`, fullPage: false },

    'google-images': { url: (q) => `https://www.google.com/search?q=${e(q)}&tbm=isch&safe=on`, fullPage: false },
    'gi': { url: (q) => `https://www.google.com/search?q=${e(q)}&tbm=isch&safe=on`, fullPage: false },

    'wikipedia': { url: (q) => `https://en.wikipedia.org/w/index.php?title=Special:Search&search=${e(q)}`, fullPage: false },
    'w': { url: (q) => `https://en.wikipedia.org/w/index.php?title=Special:Search&search=${e(q)}`, fullPage: false },
};

const e = encodeURIComponent;
const getHttpUrl = (q) => /^https?:\/\//.test(q) ? q : `http://${q}`;

async function skim(interaction) {
    const serviceKey = interaction.options.getString('service');
    const query = interaction.options.getString('query');

    // Handle Help
    if (serviceKey === 'help' || serviceKey === 'h') {
        return interaction.reply({
            embeds: [{ title: "Commands", description: "Use /skim [service] [query]\nServices: ss, google, gi, wiki..." }]
        });
    }

    const service = SERVICES[serviceKey];
    if (!service) {
        return interaction.reply({ content: `Unknown service: ${serviceKey}`, ephemeral: true });
    }

    await interaction.deferReply();
    const msg = await interaction.fetchReply();

    try {
        await takeScreenshot(service.url(query), service.fullPage, serviceKey, query, interaction, msg);
    } catch (err) {
        console.error(err);
        await interaction.editReply(`:warning: ${err.message}`);
    }
}

async function takeScreenshot(url, fullPage, cmd, query, interaction, waitingMessage) {
    console.log(`<Skim> ${interaction.user.username} used ${cmd} on: ${query}`);
    await waitingMessage.react('🆗');

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

        // Twitter specific wait handling
        const waitState = url.includes("twitter.com") ? 'networkidle' : 'load';
        await page.goto(url, { waitUntil: waitState });

        // Handle Cookie Popups
        if (url.includes('google.com')) {
            const btn = page.locator('button:has-text("Accept")').first();
            if (await btn.count() > 0) await btn.click();
        }

        const screenshot = await page.screenshot({ type: 'png', fullPage });

        await interaction.editReply({
            content: `**Skimmed:** \`${query}\` via ${cmd}`,
            files: [{ attachment: screenshot, name: 'skim.png' }]
        });

        waitingMessage.reactions.removeAll().catch(() => { });
    } finally {
        await browser.close();
    }
}

module.exports = {
    name: 'skim',
    description: 'Skims a website and produces a screenshot',
    data: new SlashCommandBuilder()
        .setName('skim')
        .setDescription('Screenshot a site or search result')
        .addStringOption(o => o.setName('service').setDescription('Service (g, gi, ss, w)').setRequired(true))
        .addStringOption(o => o.setName('query').setDescription('Search query or URL').setRequired(true)),
    async execute(interaction) {
        await skim(interaction);
    }
};