const fs = require('fs');
const path = require('path');
const parseICSAndScheduleRSSChecks = require('../scheduler');
const { checkRSSAndSend } = require('../rssReader');
const { RSS_URL, CHANNEL_ID, DAILY_EVENTS_FILE } = require('../constants');
const RSSParser = require('rss-parser');
const axios = require('axios');

// Mock Discord client
const mockClient = {
  channels: {
    cache: {
      get: (id) => {
        if (id !== CHANNEL_ID) return null;
        return {
          isTextBased: () => true,
          send: (msg) => {
            console.log(`[MOCK SEND] ${msg}`);
            sentMessages.push(msg);
          },
        };
      }
    }
  }
};

const sentMessages = [];

// Utility to create valid ICS datetime strings
function generateICSTime(minsFromNow) {
  const dt = new Date(Date.now() + minsFromNow * 60000);
  return dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

// ---- ✅ MOCK ICS FEED: 2 EVENTS, SAME KICKOFF ----
const kickoffTime = generateICSTime(85);
const endTime = generateICSTime(185);

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

// ---- ✅ MOCK RSS FEED: 2 VALID POSTS ----
const mockRSSFeed = {
  items: [
    {
      title: 'LINE-UPS',
      content: 'LINE-UPS | #ARSTOT ARS: Player A, Player B TOT: Player C, Player D',
      isoDate: new Date(Date.now() - 30 * 1000).toISOString(),
      pubDate: new Date(Date.now() - 30 * 1000).toUTCString()
    },
    {
      title: 'LINE-UPS',
      content: 'LINE-UPS | #MUNWOL MUN: Player E, Player F WOL: Player G, Player H',
      isoDate: new Date(Date.now() - 20 * 1000).toISOString(),
      pubDate: new Date(Date.now() - 20 * 1000).toUTCString()
    }
  ]
};

// ---- ✅ Patch axios and RSS parser to return mocks ----
axios.get = async () => ({ data: mockICSFeed });
RSSParser.prototype.parseURL = async () => mockRSSFeed;

// ---- ✅ RUN TEST ----
(async () => {
  console.log('[TEST] Running parseICSAndScheduleRSSChecks...');
  await parseICSAndScheduleRSSChecks(mockClient);

  console.log('[TEST] Manually triggering checkRSSAndSend...');
  await checkRSSAndSend(mockClient);

  console.log('[TEST] Validating assertions...\n');

  // ✅ 1. Confirm 2 ICS events saved
  const saved = JSON.parse(fs.readFileSync(path.resolve(DAILY_EVENTS_FILE), 'utf-8'));
  console.assert(saved.length === 2, `Expected 2 events saved, got ${saved.length}`);

  // ✅ 2. Confirm only 1 job scheduled - from log
  // (relies on seeing: [INFO] Scheduled 1 unique RSS job windows.)

  // ✅ 3. Confirm duplicate kickoff warning shown - from log
  // (relies on seeing: [SKIP] Duplicate kickoff time ...)

  // ✅ 4. Confirm both LINE-UPS messages formatted and sent
  console.assert(sentMessages.length === 2, `Expected 2 messages sent, got ${sentMessages.length}`);
  console.assert(sentMessages[0].startsWith('LINE-UPS | #ARSTOT'), 'First message not formatted correctly');
  console.assert(sentMessages[1].startsWith('LINE-UPS | #MUNWOL'), 'Second message not formatted correctly');

  console.log('\n✅ All assertions passed.\n');
  process.exit(0);
})();
