// Define fs
const fs = require('fs');

function reactFunction(message) {
    // Read from JSON files
    let reacts;
    try {
        reacts = JSON.parse(fs.readFileSync('./reacts.json', 'utf8'));
    } catch (err) {
        console.error(err);
    }

    // If the reaction comes from a bot then don't trigger - might end up in an infinite loop
    if (message.author.bot) {
        return 0;
    } else {
        // Read the file
        fs.readFile('./reacts.json', (err) => {
            if (err) {
                throw err;
            } else {
                // Iterate through all the keys in the reacts.json file
                Object.keys(reacts).forEach(item => {
                    // If any of the keys match with the message when both lower case, we need to check case sensitvitity
                    if (message.content.toLowerCase().includes(item.toLowerCase())) {
                        // Store all the vals from JSON as vars
                        var matchedKey = reacts[item];
                        var reply = matchedKey['reply'];
                        var caseSensitivity = matchedKey['caseSensitivity'];
                        var usedAnywhere = matchedKey['usedAnywhere'];

                        // Get other vars from message content
                        if (item.toLowerCase() === message.content.toLowerCase()) {
                            // And "exact phrase" is where the key matches the message exactly, regardless of casing
                            var exactPhrase = 1;
                        } else {
                            var exactPhrase = 0;
                        }

                        if (message.content.includes(item)) {
                            // Case match
                            var casesMatch = 1;
                        } else {
                            var casesMatch = 0;
                        }

                        console.log(`<Reactions> Triggered message: ${message.content}`);
                        console.log(`<Reactions> Does the phrase match: ${exactPhrase}`);
                        console.log(`<Reactions> Do cases match: ${casesMatch}`);

                        if (caseSensitivity === 1 && casesMatch === 1) {
                            //Case sens matters and cases match, proceed
                            if (usedAnywhere === 1) {
                                // Phrase can be used anywhere so send
                                message.channel.send(reply);
                                console.log('<Reactions> Bot replied to ' + item + '. Case-sensitivity = 1, Used Anywhere = 1');
                            } else if (usedAnywhere === 0 && exactPhrase === 1) {
                                // Phrase can't be used anywhere so has to be an exact match
                                // If it is, we can send it
                                message.channel.send(reply);
                                console.log('<Reactions> Bot replied to ' + item + '. Case-sensitivity = 1, Used Anywhere = 0');
                            }
                        } else if (caseSensitivity === 0) {
                            //Cases don't matter, proceed
                            if (usedAnywhere === 1) {
                                // Phrase can be used anywhere so send
                                message.channel.send(reply);
                                console.log('<Reactions> Bot replied to ' + item + '. Case-sensitivity = 0, Used Anywhere = 1');
                            } else if (usedAnywhere === 0 && exactPhrase === 1) {
                                // Phrase can't be used anywhere so has to be an exact match
                                // If it is, we can send it
                                message.channel.send(reply);
                                console.log('<Reactions> Bot replied to ' + item + '. Case-sensitivity = 0, Used Anywhere = 0');
                            }
                        } else {
                            // Cases DO matter, end
                            console.log('<Reactions> Bot did not reply to ' + item + '. Case-sensitivity did not match');
                            return 0;
                        }
                    }
                });
            }
        });
    }
}

module.exports.reactFunction = reactFunction;