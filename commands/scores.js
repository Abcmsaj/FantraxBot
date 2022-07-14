const Discord = require('discord.js');
const puppeteer = require("puppeteer");

function scores(message, args) {
    (async () => {
        message.response = processMessage(message);

        function processMessage(message) {
            return new Promise(async function (resolve, reject) {
                console.log(`[${new Date().toLocaleString()}] ${message.author.tag} requested latest scores.`);

                // Fun the puppetPng function
                puppetPng('https://www.fantrax.com/fantasy/league/rjo7oio4l4pgxnmb/livescoring');

                // Delay function used in both async puppet functions
                function delay(time) {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, time);
                    });
                }

                async function autoScroll(page) {
                    await page.evaluate(async () => {
                        await new Promise((resolve, reject) => {
                            var totalHeight = 0;
                            var distance = 100;
                            var timer = setInterval(() => {
                                var scrollHeight = document.body.scrollHeight;
                                window.scrollBy(0, distance);
                                totalHeight += distance;

                                if (totalHeight >= scrollHeight) {
                                    clearInterval(timer);
                                    resolve();
                                }
                            }, 10);
                        });
                    });
                }

                async function puppetPng(url) {
                    const browser = await puppeteer.launch({
                        executablePath: '/usr/bin/chromium-browser', // Comment out if testing on Windows
                        headless: true,
                        args: ['--no-sandbox'/*openvz*/]
                    });
                    console.log('Chromium launched');

                    // React to tell user something is happening
                    message.react('🆗');
                    try {
                        var page = await browser.newPage();
                        page.on("error", async error => {
                            resolve(await message.channel.send(`:warning: ${error.message}`));
                        });
                        await page.setViewport({ width: 400, height: 750 });
                        await page.goto('https://www.fantrax.com/fantasy/league/rjo7oio4l4pgxnmb/standings;timeframeType=BY_PERIOD?startDate=2022-08-12&endDate=2023-05-24&hideGoBackDays=true&timeStartType=PERIOD_ONLY&timeframeType=BY_PERIOD&view=REGULAR_SEASON&pageNumber=1', { waitUntil: 'networkidle0' });
                        const [button] = await page.$x("//a[contains(., 'Continue')]");
                        const [button2] = await page.$x("//button[contains(., 'Dismiss')]");
                        //await button.click(); // Continue button no longer displays
                        await button2.click();
                        await autoScroll(page);
                        await delay(500); // Small delay to prevent scrollbar showing in screenshot

                        var screenshot = await page.screenshot({
                            type: 'png',
                            fullPage: false
                        });

                        resolve(await message.channel.send({ files: [{ attachment: screenshot, name: "screenshot.png" }] }));
                    } catch (error) {
                        console.error(error);
                        resolve(await message.channel.send(`:warning: ${error.message}`));
                    } finally {
                        try {
                            await browser.close();
                            console.log('Chromium closed');
                        } catch (error) {
                            console.error(error);
                            console.log('Chromium crashed');
                            process.exit(1);
                        }
                    }
                }

            });
        };

    })().catch(error => { console.error(error); process.exit(1); });
}


module.exports = {
    name: 'scores',
    description: 'Logs into Fantrax and screenshots the scores to the Discord',
    execute(message, args) {
        scores(message, args);
    }
};
