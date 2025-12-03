const fs = require('fs');
const { DAILY_EVENTS_FILE } = require('./constants');

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function saveDailyEvents(events) {
  writeJSONFile(DAILY_EVENTS_FILE, events);
  console.log(`<Lineup Checker> [SAVE] Saved ${events.length} events to ${DAILY_EVENTS_FILE}`);
}

module.exports = { getTodayDate, writeJSONFile, saveDailyEvents };