const { chromium } = require('playwright');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');

const LEAGUE_ID = '91o90a6ymd4fcwde';
const FANTRAX_URL = `https://www.fantrax.com/fantasy/league/${LEAGUE_ID}/livescoring?mobileMatchupView=false&teamId=ALL&layout=STANDARD&mainView=MATCHUP&mobileView=MATCHUPS`;
const COOKIE_FILE = '.fantraxcookies';

async function scores(interaction) {
    await interaction.deferReply();
    const waitingMessage = await interaction.fetchReply();
    console.log(`<Scores> ${interaction.user.username} requested scores.`);

    let browser;
    try {
        await waitingMessage.react('🆗');
        browser = await chromium.launch({ headless: true });

        // Check if cookie file exists (Async)
        let storageState;
        try {
            await fs.access(COOKIE_FILE);
            storageState = COOKIE_FILE;
        } catch {
            storageState = undefined;
        }

        const context = await browser.newContext({
            viewport: { width: 400, height: 600 },
            storageState
        });
        const page = await context.newPage();

        await page.goto(FANTRAX_URL);

        // Wait for element instead of generic timeout if possible, but keeping logic similar
        try {
            await page.getByText('Live Scoring').waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            // Sometimes it might not appear if cookies need consent
        }

        // First Run / Cookie Consent
        if (!storageState) {
            console.log('<Scores> First run setup...');
            await interaction.editReply('First-time setup: Handling cookies...');

            // Replaces waitForTimeout(2000)
            await new Promise(r => setTimeout(r, 2000));

            const frameLocator = page.frameLocator('iframe[title="SP Consent Message"]');
            const buttons = [
                { name: 'Accept', locator: frameLocator.getByRole("button", { name: 'Accept' }) },
                { name: 'Consent', locator: page.getByRole("button", { name: 'Consent' }) },
                { name: 'Dismiss', locator: page.getByRole("button", { name: 'Dismiss' }) }
            ];

            for (const btn of buttons) {
                if (await btn.locator.isVisible({ timeout: 2500 })) {
                    await btn.locator.click();
                    console.log(`<Scores> Clicked ${btn.name}`);
                }
            }

            await new Promise(r => setTimeout(r, 2000));
            await context.storageState({ path: COOKIE_FILE });
            console.log('<Scores> Cookies saved.');
        }

        // Smooth Scroll
        await page.evaluate(async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            for (let i = 0; i < document.body.scrollHeight; i += 100) {
                window.scrollTo(0, i);
                await delay(50);
            }
        });

        const screenshot = await page.screenshot({ type: 'png', fullPage: true });

        await interaction.editReply({
            content: null,
            files: [{ attachment: screenshot, name: 'scores.png' }]
        });
        console.log('<Scores> Screenshot sent.');

    } catch (error) {
        console.error(error);
        await interaction.editReply(`:warning: Error: ${error.message}`);
    } finally {
        if (browser) await browser.close();
        waitingMessage.reactions.removeAll().catch(() => { });
    }
}

module.exports = {
    name: 'scores',
    description: 'Get Fantrax scores',
    data: new SlashCommandBuilder()
        .setName('scores')
        .setDescription('Request the latest scores'),
    async execute(interaction) {
        await scores(interaction);
    }
};