// modules/lineupChecker/test/scheduler.test.js
const parseICSAndScheduleRSSChecks = require('../scheduler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DAILY_EVENTS_FILE } = require('../constants');

const mockClient = { id: 'mockClient' };

const mockICSFeed = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:⚽️ Match One
DTSTART:${generateICSTime(90)}
DTEND:${generateICSTime(120)}
END:VEVENT
BEGIN:VEVENT
SUMMARY:⚽️ Match Two
DTSTART:${generateICSTime(90)}
DTEND:${generateICSTime(120)}
END:VEVENT
END:VCALENDAR
`;

function generateICSTime(mins) {
  const dt = new Date(Date.now() + mins * 60000);
  return dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

axios.get = async () => ({ data: mockICSFeed });

(async () => {
  await parseICSAndScheduleRSSChecks(mockClient);
  const saved = JSON.parse(fs.readFileSync(path.resolve(DAILY_EVENTS_FILE), 'utf-8'));
  console.assert(saved.length === 2, 'Expected 2 events saved');
  console.log('[PASS] scheduler.test.js');
})();
