const puppeteer = require('puppeteer');
const { SlashCommandBuilder } = require('@discordjs/builders');

function skim(interaction) {
    (async () => {
        // Get the cmd used and the query (the rest of the arguments)
        const cmd = interaction.options.getString('service');
        const query = interaction.options.getString('query');

        // Defer the reply as this could take some time to return an image
        const waitingMessage = await interaction.deferReply({ fetchReply: true });
        // Run the function
        processMessage(interaction);

        function processMessage(interaction) {
            return new Promise(async function (resolve, reject) {
                console.log(`<Skim> [${new Date().toLocaleString()}] ${interaction.user.username} invoked command: ${interaction}`);

                // Switch statement based on cmd
                switch (cmd) {
                    case "help":
                    case "h":
                        resolve(await interaction.editReply({
                            embed: {
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
                            }
                        }));
                        break;
                    case "screenshot":
                    case "ss":
                        puppetPng((query.startsWith("http://") || query.startsWith("https://")) ? query : `http://${query}`, false);
                        break;
                    case "screenshotf":
                    case "ssf":
                        puppetPng((query.startsWith("http://") || query.startsWith("https://")) ? query : `http://${query}`, true);
                        break;
                    case "google":
                    case "g":
                        puppetPng(`https://www.google.com/search?q=${encodeURIComponent(query)}`, false);
                        break;
                    case "google-im-feeling-lucky":
                    case "gifl":
                        puppetPng(`https://duckduckgo.com/?q=\\${encodeURIComponent(query)}`, true); // Need to use DDG instead of Google for this as Google now shows redirect page
                        break;

                    case "google-images":
                    case "gi":
                        puppetPng(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=${(message.channel.nsfw) ? 'off' : 'on'}`, false);
                        break;
                    case "wikipedia":
                    case "w":
                        puppetPng(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(query)}`, false);
                        break;
                    case "wikipediaf":
                    case "wf":
                        puppetPng(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(query)}`, true);
                        break;
                }

                // Delay function used in both async puppet functions
                function delay(time) {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, time);
                    });
                }

                async function puppetPng(url, fullPageBool) {
                    const browser = await puppeteer.launch({
                        executablePath: '/usr/bin/chromium', // Comment out if testing on Windows
                        headless: true,
                        args: ['--no-sandbox'/*openvz*/]
                    });
                    console.log('<Skim> Chromium launched');

                    // React to tell user something is happening
                    waitingMessage.react('🆗');
                    try {
                        var page = await browser.newPage();
                        page.on("error", async error => {
                            resolve(await interaction.editReply(`:warning: ${error.message}`));
                        });

                        await page.setViewport({ width: 1440, height: 900 });

                        if ((query.startsWith('https://twitter.com') || query.startsWith('https://twitter.com') || query.startsWith('twitter.com'))) {
                            await page.goto(url, { waitUntil: 'networkidle0' });
                        } else {
                            await page.goto(url, { waitUntil: 'load' });
                        }

                        if (url.startsWith('https://duckduckgo.com/')) { // If we choose the GIFL option, we need time for a redirect to happen
                            await delay(2000);
                        }

                        if (url.startsWith('https://www.google.com/')) { // If we choose the Google option, need to confirm cookies
                            const [button] = await page.$x("//button[contains(., 'Accept')]");
                            await button.click();
                        }

                        var screenshot = await page.screenshot({ type: 'png', fullPage: fullPageBool });
                        resolve(await interaction.editReply({ content: '**Skimmed:**\n`' + query + ' using ' + cmd + '`', files: [{ attachment: screenshot, name: "screenshot.png" }] }));

                        // Remove all emojis from the post at the end
                        waitingMessage.reactions.removeAll();
                    } catch (error) {
                        console.error(error);
                        resolve(await interaction.editReply(`:warning: ${error.message}`));
                    } finally {
                        try {
                            await browser.close();
                            console.log('<Skim> Chromium closed');
                        } catch (error) {
                            console.error(error);
                            console.log('<Skim> Chromium crashed');
                            process.exit(1);
                        }
                    }
                }
            });
        };

    })().catch(error => { console.error(error); process.exit(1); });
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
        skim(interaction);
    }
};
