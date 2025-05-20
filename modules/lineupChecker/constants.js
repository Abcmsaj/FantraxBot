const { lineupsChannel, icsUrl } = require('../../FantraxConfig/config.json');

module.exports = {
    RSS_URL: 'https://bsky.app/profile/ffscoutfpl.bsky.social/rss',
    DAILY_EVENTS_FILE: './modules/lineupChecker/lineupEvents.json',
    CHANNEL_ID: lineupsChannel,
    ICS_URL: icsUrl,
  };
  