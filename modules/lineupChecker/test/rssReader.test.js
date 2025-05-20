// modules/lineupChecker/test/rssReader.test.js
const { checkRSSAndSend } = require('../rssReader');
const RSSParser = require('rss-parser');

const mockClient = {
  channels: {
    cache: {
      get: () => ({
        isTextBased: () => true,
        send: (msg) => console.log(`[MOCK SEND] ${msg}`),
      }),
    },
  },
};

RSSParser.prototype.parseURL = async () => ({
  items: [
    { content: 'LINE-UPS | #TEST TEAM: Player A, Player B', isoDate: new Date().toISOString(), pubDate: new Date().toUTCString() },
    { content: 'NOT-A-LINE-UP POST', isoDate: new Date().toISOString() }
  ],
});

(async () => {
  console.log('[TEST] checkRSSAndSend...');
  await checkRSSAndSend(mockClient);
  console.log('[PASS] rssReader.test.js');
})();
