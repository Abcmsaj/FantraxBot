const axios = require('axios');
const ical = require('node-ical');
const { saveDailyEvents, getTodayDate } = require('./utils');
const { scheduleRSSWindow } = require('./scheduleWindow');
const { ICS_URL } = require('./constants');
const { checkRSSAndSend } = require('./rssReader');

const scheduledJobs = new Set();

async function parseICSAndScheduleRSSChecks(client) {
  scheduledJobs.clear();
  console.log(`<Lineup Checker> [INFO] Cleared all previously scheduled jobs.`);
  try {
    const response = await axios.get(ICS_URL);
    const events = ical.parseICS(response.data);
    const now = new Date();
    const today = getTodayDate();
    const todaysEvents = [];
    const uniqueKickoffMap = new Map();

    for (const key in events) {
      const event = events[key];
      if (event.type !== 'VEVENT') continue;
      if (!event.summary?.startsWith('⚽️')) continue;

      const eventDate = event.start.toISOString().slice(0, 10);
      if (eventDate !== today) continue;

      const kickoffISO = event.start.toISOString();
      if (!uniqueKickoffMap.has(kickoffISO)) {
        uniqueKickoffMap.set(kickoffISO, event.summary);
      } else {
        console.log(`<Lineup Checker> [SKIP] Duplicate kickoff time ${kickoffISO} for summary "${event.summary}"]`);
      }

      todaysEvents.push({
        summary: event.summary,
        start: event.start.toISOString(),
        end: event.end?.toISOString() || null,
      });
    }

    for (const [kickoffISO, summary] of uniqueKickoffMap) {
      const kickoffTime = new Date(kickoffISO);
      const rssStart = new Date(kickoffTime.getTime() - 75 * 60000);
      if (rssStart > now) scheduleRSSWindow(rssStart, summary, checkRSSAndSend, scheduledJobs, client);
    }

    saveDailyEvents(todaysEvents);
    console.log(`<Lineup Checker> [INFO] Scheduled ${scheduledJobs.size} unique RSS job window(s).`);
  } catch (err) {
    console.error('<Lineup Checker> [ERROR] Failed to parse ICS:', err.message);
  }
}

module.exports = parseICSAndScheduleRSSChecks;