// Function to replace and modify URLs in a Discord message
function fixSocialsFunction(message) {
    // Check if the message content exists
    if (!message || !message.content) {
        return null; // Return null or handle accordingly if there's no message content
    }

    // Regular expression patterns to match the specified URLs and queries for each website
    const twitterPattern = /(https?:\/\/(?:www\.)?(?:twitter\.com)\/[\w\d\/-]*)\??[^ \n]*/g;
    const instagramPattern = /(https?:\/\/(?:www\.)?(?:instagram\.com)\/[\w\d\/-]+)\??[^ \n]*/g;
    const redditPattern = /(https?:\/\/(?:www\.)?(?:reddit\.com)\/[\w\d\/-]+)\??[^ \n]*/g;
    const vmTiktokPattern = /(https?:\/\/(?:www\.)?(?:vm\.tiktok\.com)\/[\w\d\/-]+)\??[^ \n]*/g;
    const tiktokPattern = /(https?:\/\/(?:www\.)?(?:tiktok\.com)\/@(?:[\w\d-]+)\/video\/[\w\d-]+)\??[^ \n]*/g;
    const xPattern = /(https?:\/\/(?:www\.)?(?:x\.com)\/[\w\d\/-]+)\??[^ \n]*/g;

    const matchedTwitterURLs = message.content.match(twitterPattern) || [];
    const matchedInstagramURLs = message.content.match(instagramPattern) || [];
    const matchedRedditURLs = message.content.match(redditPattern) || [];
    const matchedVmTikTokURLs = message.content.match(vmTiktokPattern) || [];
    const matchedTikTokURLs = message.content.match(tiktokPattern) || [];
    const matchedXURLs = message.content.match(xPattern) || [];

    const modifiedTwitterURLs = modifyURLs(matchedTwitterURLs, 'https://fxtwitter.com');
    const modifiedInstagramURLs = modifyURLs(matchedInstagramURLs, 'https://ddinstagram.com');
    const modifiedRedditURLs = modifyURLs(matchedRedditURLs, 'https://rxyddit.com');
    const modifiedTikTokURLs = modifyURLs(matchedTikTokURLs, 'https://tiktxk.com');
    const modifiedVmTikTokURLs = modifyURLs(matchedVmTikTokURLs, 'https://vm.tiktxk.com');
    const modifiedXURLs = modifyURLs(matchedXURLs, 'https://fxtwitter.com');

    // Construct a new message containing only the modified URLs
    const modifiedContent = [
        ...modifiedTwitterURLs,
        ...modifiedInstagramURLs,
        ...modifiedRedditURLs,
        ...modifiedTikTokURLs,
        ...modifiedVmTikTokURLs,
        ...modifiedXURLs
    ].join('\r');

    message.suppressEmbeds(true).then(() => {
        message.reply({ content: modifiedContent, allowedMentions: { repliedUser: false } });
        message.suppressEmbeds(true); // fall back if the first suppress embeds failed
    });
}

// Function to modify URLs with a replacement URL
function modifyURLs(urls, replacement) {
    if (!urls) {
        return [];
    }
    return urls.map(url => url.replace(/\?.*/, '').replace(/https?:\/\/(?:www\.)?(?:twitter\.com|instagram\.com|reddit\.com|vm\.tiktok\.com|tiktok\.com|x\.com)/, replacement));
}

module.exports.fixSocialsFunction = fixSocialsFunction;