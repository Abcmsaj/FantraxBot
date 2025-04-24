const { chromium } = require('playwright');
const { SlashCommandBuilder } = require('@discordjs/builders');

const LEAGUE_ID = '3903zpaflzgrpsu6';
const START_DATE = '2024-08-16';
const END_DATE = '2025-05-26';
const FANTRAX_URL = `https://www.fantrax.com/fantasy/league/${LEAGUE_ID}/standings;timeframeType=BY_PERIOD?startDate=${START_DATE}&endDate=${END_DATE}&hideGoBackDays=true&timeStartType=PERIOD_ONLY&timeframeType=BY_PERIOD&view=REGULAR_SEASON&pageNumber=1`;

async function scores(interaction) {
    const waitingMessage = await interaction.deferReply({ fetchReply: true });
    console.log(`<Scores> [${new Date().toLocaleString()}] ${interaction.user.username} requested latest scores.`);

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 400, height: 750 },
            storageState: '.fantraxCookies.json'
        });
        const page = await context.newPage();

        await page.goto(FANTRAX_URL);
        await page.waitForTimeout(2500);

        await page.evaluate(async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            for (let i = 0; i < document.body.scrollHeight; i += 100) {
                window.scrollTo(0, i);
                await delay(50);
            }
        });

        const screenshot = await page.screenshot({ type: 'png' });
        await interaction.editReply({ files: [{ attachment: screenshot, name: 'screenshot.png' }] });
        console.log('<Scores> Screenshot sent');

    } catch (error) {
        console.error(error);
        await interaction.editReply(`:warning: ${error.message}`);

    } finally {
        if (browser) {
            await browser.close();
            console.log('<Scores> Chromium closed');
        }
    }
}

module.exports = {
    name: 'scores',
    description: 'Logs into Fantrax and screenshots the scores to the Discord',
    data: new SlashCommandBuilder()
        .setName('scores')
        .setDescription('Request the latest scores for the current gameweek'),
    async execute(interaction) {
        await scores(interaction);
    }
};
