const { chromium } = require('playwright');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

const LEAGUE_ID = '91o90a6ymd4fcwde';
const FANTRAX_URL = `https://www.fantrax.com/fantasy/league/${LEAGUE_ID}/livescoring?mobileMatchupView=false&teamId=ALL&layout=STANDARD&mainView=MATCHUP&mobileView=MATCHUPS`;
const COOKIE_FILE = '.fantraxcookies';

async function scores(interaction) {
    await interaction.deferReply();
    const waitingMessage = await interaction.fetchReply();

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

            await page.waitForTimeout(2000);

            // Define the iframe for buttons that appear within it
            const frameLocator = page.frameLocator('iframe[title="SP Consent Message"]');

            // List of potential buttons and the context to find them in (page or iframe)
            const buttonsToClick = [
                { name: 'Accept', context: frameLocator, location: 'iframe' },
                { name: 'Consent', context: page, location: 'main page' },
                { name: 'Dismiss', context: page, location: 'main page' }
            ];

            // Loop through each defined button and click if it's visible
            for (const btn of buttonsToClick) {
                const buttonLocator = btn.context.getByRole("button", { name: btn.name });
                
                if (await buttonLocator.isVisible({ timeout: 2500 })) {
                    await buttonLocator.click();
                    console.log(`<Scores> Clicked the "${btn.name}" button on the ${btn.location}.`);
                } else {
                    console.log(`<Scores> Did not find "${btn.name}" button on the ${btn.location}.`);
                }
            }

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

            try {
                await waitingMessage.reactions.removeAll();
            } catch (err) {
                console.warn('<Scores> Failed to remove reactions:', err.message);
            }

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