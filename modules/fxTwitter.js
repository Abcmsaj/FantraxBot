// Function to replace and modify URLs in a Discord message
function fxTwitterFunction(message) {
    // Check if the message content exists
    if (!message || !message.content) {
        return null; // Return null or handle accordingly if there's no message content
    }

    // Regular expression pattern to match the specified URLs and queries
    const urlPattern = /(https:\/\/(?:www\.)?(x\.com|twitter\.com)\/[\w\d\/-]+)\??[^ \n]*/g;

    const matchedURLs = message.content.match(urlPattern);

    if (!matchedURLs) {
        return null; // Return null if no URLs are found
    }

    const modifiedURLs = []

    // Modify each matched URL
    for (let i = 0; i < matchedURLs.length; i++) {
        const modifiedURL = matchedURLs[i].replace(/\?.*/, '').replace(/(https:\/\/(?:www\.)?(x\.com|twitter\.com))/, 'https://fxtwitter.com');
        modifiedURLs.push(modifiedURL);
    }

    const modifiedContent = modifiedURLs.join('\n'); // Join modified URLs with a line break
    message.suppressEmbeds(true);
    message.reply({ content: modifiedContent, allowedMentions: { repliedUser: false } });

}

module.exports.fxTwitterFunction = fxTwitterFunction;