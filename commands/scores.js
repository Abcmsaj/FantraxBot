const { chromium } = require('playwright');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

const LEAGUE_ID = '91o90a6ymd4fcwde';
const FANTRAX_URL = `https://www.fantrax.com/fantasy/league/${LEAGUE_ID}/livescoring?mobileMatchupView=false&teamId=ALL&layout=STANDARD&mainView=MATCHUP&mobileView=MATCHUPS`;
const COOKIE_FILE = '.fantraxcookies';

async function scores(interaction) {
    const waitingMessage = await interaction.deferReply({ fetchReply: true });
    console.log(`<Scores> [${new Date().toLocaleString()}] ${interaction.user.username} requested latest scores.`);

    let browser;
    try {
        await waitingMessage.react('🆗');
        browser = await chromium.launch({ headless: true });

        // Load cookies if the file exists to maintain the session
        const context = await browser.newContext({
            viewport: { width: 400, height: 600 },
            storageState: fs.existsSync(COOKIE_FILE) ? COOKIE_FILE : undefined
        });
        const page = await context.newPage();

        await page.goto(FANTRAX_URL);
        await page.getByText('Live Scoring').waitFor({ state: 'visible' });

        // This block runs only if the cookie file does not exist (first-time setup)
        if (!fs.existsSync(COOKIE_FILE)) {
            console.log('<Scores> First run: Handling cookie consent and saving session.');
            await interaction.editReply('First-time setup: Handling cookie pop-ups...');

            // Click consent/dismiss buttons that may appear on the first visit
            await page.getByRole("button", { name: 'Consent' }).click();
            await page.getByRole("button", { name: 'Dismiss' }).click();
            await page.waitForTimeout(2000); // Wait for any modals to close

            // Save the session state for future runs
            await context.storageState({ path: COOKIE_FILE });
            console.log('<Scores> Cookie state saved.');
        }


        // Scroll through the page to load all dynamic content
        await page.evaluate(async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            for (let i = 0; i < document.body.scrollHeight; i += 100) {
                window.scrollTo(0, i);
                await delay(50);
            }
        });

        const screenshot = await page.screenshot({ type: 'png', fullPage: true });
        // Clear the "First-time setup" message if it was shown
        await interaction.editReply({ content: null, files: [{ attachment: screenshot, name: 'screenshot.png' }] });
        console.log('<Scores> Screenshot sent');

    } catch (error) {
        console.error(error);
        await interaction.editReply(`:warning: ${error.message}`);

    } finally {
        if (browser) {
            await browser.close();
            console.log('<Scores> Chromium closed');
            await waitingMessage.reactions.removeAll();
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