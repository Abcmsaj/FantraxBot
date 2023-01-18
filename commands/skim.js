const Discord = require('discord.js');
const puppeteer = require("puppeteer");

function skim(message, args) {
    (async () => {
        message.response = processMessage(message);

        function processMessage(message) {
            return new Promise(async function (resolve, reject) {
                console.log(`[${new Date().toLocaleString()}] ${message.author.tag} invoked command: ${message.content}`);

                // Get the cmd used and the query (the rest of the arguments)
                var cmd = args[0];
                var query = args.slice(1);
                var queryCombined = '';

                // Combine the query if it's >1 word, splitting commas
                for (var i = 0; i < query.length; i++) {
                    queryCombined += query[i] + ' ';
                }

                // Switch statement based on cmd
                switch (cmd) {
                    case "help":
                    case "h":
                        resolve(await message.channel.send({
                            embed: {
                                title: "Commands",
                                description:
                                    "\n`!skim athletic <url>`" +
                                    "\n`!skim screenshot <url>`" +
                                    "\n`!skim screenshotf <url>`" +
                                    "\n`!skim google <query>`" +
                                    "\n`!skim google-im-feeling-lucky <query>`" +
                                    "\n`!skim google-images <query>`" +
                                    "\n`!skim wikipedia <query>`" +
                                    "\n`!skim wikipediaf <query>`" +
                                    "\n Each command has an abbreviated version." +
                                    "\n"
                            }
                        }));
                        break;
                    case "screenshot":
                    case "ss":
                        puppetPng((queryCombined.startsWith("http://") || queryCombined.startsWith("https://")) ? queryCombined : `http://${queryCombined}`, false);
                        break;
                    case "screenshotf":
                    case "ssf":
                        puppetPng((queryCombined.startsWith("http://") || queryCombined.startsWith("https://")) ? queryCombined : `http://${queryCombined}`, true);
                        break;
                    case "athletic":
                    case "a":
                        if (queryCombined.startsWith('theathletic')) {
                            queryCombined = `https://${queryCombined}`;
                        }
                        if (!(queryCombined.startsWith("http://theathletic") || queryCombined.startsWith("https://theathletic"))) {
                            message.channel.send(`:warning: That is not an Athletic link`);
                            return;
                        } else {
                            puppetJpeg(queryCombined);
                        }
                        break;
                    case "google":
                    case "g":
                        puppetPng(`https://www.google.com/search?q=${encodeURIComponent(queryCombined)}`, false);
                        break;
                    case "google-im-feeling-lucky":
                    case "gifl":
                        puppetPng(`https://duckduckgo.com/?q=\\${encodeURIComponent(queryCombined)}`, true); // Need to use DDG instead of Google for this as Google now shows redirect page
                        break;

                    case "google-images":
                    case "gi":
                        puppetPng(`https://www.google.com/search?q=${encodeURIComponent(queryCombined)}&tbm=isch&safe=${(message.channel.nsfw) ? 'off' : 'on'}`, false);
                        break;
                    case "wikipedia":
                    case "w":
                        puppetPng(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(queryCombined)}`, false);
                        break;
                    case "wikipediaf":
                    case "wf":
                        puppetPng(`https://en.wikipedia.org/w/index.php?title=Special:Search&search=${encodeURIComponent(queryCombined)}`, true);
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
                    console.log('Chromium launched');

                    // React to tell user something is happening
                    message.react('🆗');
                    try {
                        var page = await browser.newPage();
                        page.on("error", async error => {
                            resolve(await message.channel.send(`:warning: ${error.message}`));
                        });

                        await page.setViewport({ width: 1440, height: 900 });

                        if ((queryCombined.startsWith('https://twitter.com') || queryCombined.startsWith('https://twitter.com') || queryCombined.startsWith('twitter.com'))) {
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
                        resolve(await message.channel.send('**Skimmed:**\n`' + message.author.tag + ' searched ' + queryCombined + 'using ' + cmd + '`'));
                        resolve(await message.channel.send({ files: [{ attachment: screenshot, name: "screenshot.png" }] }));
                        message.delete();
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

                async function puppetJpeg(url) {
                    const browser = await puppeteer.launch({
                        executablePath: '/usr/bin/chromium', // Comment out if testing on Windows
                        headless: true,
                        args: ['--no-sandbox'/*openvz*/,
                            '--disable-extensions-except=../../../../../FantraxConfig/ext/',
                            '--load-extension=../../../../..FantraxConfig/ext/',
                            '--display=:1', // Comment out if testing on Windows
                            '--disable-gpu']
                    });
                    console.log('Chromium launched');

                    message.react('🆗');
                    try {
                        await delay(2000); // Delay is here to give time for the extension to load
                        var page = await browser.newPage();
                        page.on("error", async error => {
                            resolve(await message.channel.send(`:warning: ${error.message}`));
                        });

                        await page.setViewport({ width: 1440, height: 900 });
                        await page.goto(url, { waitUntil: 'networkidle0' });
                        var screenshot = await page.screenshot({ type: 'jpeg', quality: 75, fullPage: true });
                        //var pdf = await page.pdf({ format: 'A4', printBackground: true, }); PDF generation only possible headless = true, extensions only possible when headless = false...
                        resolve(await message.channel.send('**Skimmed:**\n`' + message.author.tag + ' searched ' + queryCombined + 'using ' + cmd + '`'));
                        resolve(await message.channel.send({ files: [{ attachment: screenshot, name: "screenshot.jpeg" }] }));
                        message.delete();
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
    name: 'skim',
    description: 'Skims a website and produces a screenshot to be posted into Discord',
    execute(message, args) {
        skim(message, args);
    }
};
