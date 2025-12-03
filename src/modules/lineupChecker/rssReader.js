const RSSParser = require('rss-parser');
const { CHANNEL_ID, RSS_URL } = require('./constants');
const { formatLineupMessage } = require('./formatter');

const parser = new RSSParser();

async function checkRSSAndSend(client) {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return console.warn('<Lineup Checker> [WARN] Discord channel not found or not text-based.');
    }

    const now = Date.now();
    let newPosts = 0;

    for (const item of feed.items) {
      const content = item.content || '';
      const pubDate = new Date(item.isoDate).getTime();

      if (content.trim().startsWith('LINE-UPS') && pubDate <= now && now - pubDate <= 65000) {
        const message = formatLineupMessage(content);
        await channel.send(message);
        console.log(`<Lineup Checker> [SEND] Sent LINE-UPS post published at ${item.pubDate}`);
        newPosts++;
      }
    }

    if (newPosts === 0) {
      console.log('<Lineup Checker> [INFO] No new LINE-UPS posts in the last minute.');
    }
  } catch (err) {
    console.error('<Lineup Checker> [ERROR] Failed RSS check:', err.message);
  }
}

module.exports = { checkRSSAndSend };