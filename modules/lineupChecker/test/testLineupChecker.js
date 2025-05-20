const parseICSAndScheduleRSSChecks = require('../scheduler');
const { checkRSSAndSend } = require('../rssReader');
const { RSS_URL, CHANNEL_ID } = require('../constants');
const RSSParser = require('rss-parser');
const ical = require('node-ical');
const axios = require('axios');

// Mock Discord client
const mockClient = {
  channels: {
    cache: {
      get: (id) => {
        if (id !== CHANNEL_ID) return null;
        return {
          isTextBased: () => true,
          send: (msg) => console.log(`[MOCK SEND] ${msg}`),
        };
      }
    }
  }
};

// Utility to create valid ICS date strings
function generateICSTime(minsFromNow) {
  const dt = new Date(Date.now() + minsFromNow * 60000);
  return dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

// ---- ✅ MOCK ICS FEED ----
const kickoffTime = generateICSTime(85); // kickoff in 75 mins
const endTime = generateICSTime(185);    // 2h later

const mockICSFeed = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:⚽️ Test Match 1
DTSTART:${kickoffTime}
DTEND:${endTime}
END:VEVENT
BEGIN:VEVENT
SUMMARY:⚽️ Test Match 2
DTSTART:${kickoffTime}
DTEND:${endTime}
END:VEVENT
END:VCALENDAR
`;

// ---- ✅ MOCK RSS FEED ----
const mockRSSFeed = {
  items: [{
    title: 'LINE-UPS',
    content: 'LINE-UPS | #ARSTOT ⭕ ARS: Player A, Player B 🐓 TOT: Player C, Player D',
    isoDate: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
    pubDate: new Date(Date.now() - 30 * 1000).toUTCString() // 30 seconds ago
  },
  {
    title: 'LINE-UPS',
    content: 'LINE-UPS | #MUNWOL 👹 MUN: Player A, Player B 🐺 WOL: Player C, Player D',
    isoDate: new Date(Date.now() - 20 * 1000).toISOString(), // 20 seconds ago
    pubDate: new Date(Date.now() - 20 * 1000).toUTCString() // 20 seconds ago
  }]
};

// ---- ✅ Patch axios and RSSParser ----
axios.get = async () => ({ data: mockICSFeed });
RSSParser.prototype.parseURL = async () => mockRSSFeed;

// ---- ✅ RUN TEST ----
(async () => {
  console.log('[TEST] Running parseICSAndScheduleRSSChecks...');
  await parseICSAndScheduleRSSChecks(mockClient);

  console.log('[TEST] Manually triggering checkRSSAndSend...');
  await checkRSSAndSend(mockClient);

  console.log('[TEST] Done');
  process.exit(0);
})();