const puppeteer = require('puppeteer');
const { SlashCommandBuilder } = require('@discordjs/builders');

function scores(interaction) {
    (async () => {
        const waitingMessage = await interaction.deferReply({ fetchReply: true });
        processMessage(interaction);

        function processMessage(interaction) {
            return new Promise(async function (resolve, reject) {
                console.log(`<Scores> [${new Date().toLocaleString()}] ${interaction.user.username} requested latest scores.`);

                // Run the puppetPng function
                puppetPng('https://www.fantrax.com/fantasy/league/rjo7oio4l4pgxnmb/standings;timeframeType=BY_PERIOD?startDate=2022-08-12&endDate=2023-05-24&hideGoBackDays=true&timeStartType=PERIOD_ONLY&timeframeType=BY_PERIOD&view=REGULAR_SEASON&pageNumber=1');

                // Delay function used in both async puppet functions
                function delay(time) {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, time);
                    });
                }

                // async function autoScroll(page) {
                //     await page.evaluate(async () => {
                //         await new Promise((resolve, reject) => {
                //             var totalHeight = 0;
                //             var distance = 100;
                //             var timer = setInterval(() => {
                //                 var scrollHeight = document.body.scrollHeight;
                //                 window.scrollBy(0, distance);
                //                 totalHeight += distance;

                //                 if (totalHeight >= scrollHeight) {
                //                     clearInterval(timer);
                //                     resolve();
                //                 }
                //             }, 10);
                //         });
                //     });
                // }

                async function puppetPng(url) {
                    const browser = await puppeteer.launch({
                        executablePath: '/usr/bin/chromium', // Comment out if testing on Windows
                        headless: true,
                        args: ['--no-sandbox'/*openvz*/]
                    });
                    console.log('<Scores> Chromium launched');

                    // React to tell user something is happening
                    waitingMessage.react('🆗');
                    try {
                        var page = await browser.newPage();
                        page.on("error", async error => {
                            resolve(await interaction.editReply(`:warning: ${error.message}`));
                        });
                        await page.setViewport({ width: 400, height: 750 });
                        await page.goto(url, { waitUntil: 'networkidle2' });
                        await delay(2000); // Small delay to wait for page load fully as networkidle0 no longer works
                        // const [button] = await page.$x("//a[contains(., 'Continue')]");
                        // const [button2] = await page.$x("//button[contains(., 'Dismiss')]");
                        // const [button3] = await page.$x("//button[contains(., 'AGREE')]");
                        const [button4] = await page.$x(`//*[@id="qc-cmp2-ui"]/div[2]/div/button[3]`); // AGREE button to privacy policy
                        const [button5] = await page.$x(`/html/body/app-root/div/div[1]/layout-overlay/overlay-toasts/toast/section/div[1]/button[3]`); // Dismiss button for cookies

                        if (!button4) {
                            console.log('<Scores> No AGREE button on page');
                        } else {
                            await button4.click();
                        }

                        if (!button5) {
                            console.log('<Scores> No dismiss button to click');
                        } else {
                            await button5.click();
                        }

                        // await autoScroll(page); // Removed scrolling in favour of clipping the screenshot
                        await delay(500); // Small delay to prevent scrollbar showing in screenshot

                        var screenshot = await page.screenshot({
                            type: 'png',
                            fullPage: false,
                            clip: {
                                x: 0,
                                y: 1230,
                                height: 750,
                                width: 400
                            }
                        });

                        // Post edit deferredReply with screenshot of scores
                        resolve(await interaction.editReply({ files: [{ attachment: screenshot, name: "screenshot.png" }] }));
                    } catch (error) {
                        console.error(error);
                        resolve(await interaction.editReply(`:warning: ${error.message}`));
                    } finally {
                        try {
                            await browser.close();
                            console.log('<Scores> Chromium closed');
                        } catch (error) {
                            console.error(error);
                            console.log('<Scores> Chromium crashed');
                            process.exit(1);
                        }
                    }

                    // Remove all emojis from the post at the end
                    waitingMessage.reactions.removeAll();
                }

            });
        };

    })().catch(error => { console.error(error); process.exit(1); });
}

// function delay(time) {
//     return new Promise(function (resolve) {
//         setTimeout(resolve, time);
//     });
// }

module.exports = {
    name: 'scores',
    description: 'Logs into Fantrax and screenshots the scores to the Discord',
    data: new SlashCommandBuilder()
        .setName('scores')
        .setDescription('Request the latest scores for the current gameweek'),
    execute(interaction) {
        scores(interaction);
    }
};
