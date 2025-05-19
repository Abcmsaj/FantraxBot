// modules/lineupChecker.js
const fs = require('fs');
const axios = require('axios');
const ical = require('node-ical');
const RSSParser = require('rss-parser');
const schedule = require('node-schedule');
const { lineupsChannel, icsUrl } = require('../FantraxConfig/config.json');

const CHANNEL_ID = lineupsChannel;
const ICS_URL = icsUrl;
const RSS_URL = 'https://bsky.app/profile/ffscoutfpl.bsky.social/rss';
const DAILY_EVENTS_FILE = './lineupEvents.json';

const parser = new RSSParser();

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function saveDailyEvents(events) {
  writeJSONFile(DAILY_EVENTS_FILE, events);
  console.log(`[SAVE] Saved ${events.length} events to ${DAILY_EVENTS_FILE}`);
}

function scheduleRSSWindow(startTime, eventSummary, checkRSSAndSend) {
  console.log(`[SCHEDULE] RSS check window for "${eventSummary}" at ${startTime.toISOString()}`);
  for (let i = 0; i < 15; i++) {
    const checkTime = new Date(startTime.getTime() + i * 60000);
    schedule.scheduleJob(checkTime, () => {
      console.log(`[CHECK] RSS check at ${checkTime.toISOString()} for "${eventSummary}"`);
      checkRSSAndSend();
    });
  }
}

function formatLineupMessage(content) {
    const emojiMapFromTag = (tag) => {
      const map = {
        ARS: '⭕', AVL: '🟣', BRE: '🐝', BHA: '🕊', BOU: '🍒', BUR: '', CHE: '🧿',
        CRY: '🦅', EVE: '🍬', FUL: '⬜', IPS: '🚜', LEE: '', LEI: '🦊', LIV: '🔴', MCI: '🔵',
        MUN: '👹', NEW: '⚫', NFO: '🌳', SHU: '', SOU: '😇', SUN: '', TOT: '🐓', WHU: '⚒', WOL: '🐺'
      };
      return map[tag.toUpperCase()] || '';
    };
  
    const matchTagMatch = content.match(/\|\s(#\w+)/);
    const tag = matchTagMatch?.[1] || '#MATCH';
    const teamsFromTag = tag.slice(1).match(/.{3}/g);
    const lines = content.split(/\s(?=[A-Z]{2,3}:)/g);
    const [_, team1Line, team2Line] = lines;
  
    const formatTeam = (line, teamCode) => {
      if (!line) return '';
      const parts = line.split(/:|, /);
      const players = parts.slice(1).join(', ').replace(/\s+#FPL$/, '').trim();
      // Remove trailing emojis
      players = players.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]+$/u, '').trim();
      const emoji = emojiMapFromTag(teamCode);
      return `${emoji ? emoji + ' ' : ''}${teamCode}: ${players}`;
    };
  
    const formatted = `LINE-UPS | ${tag}\n${formatTeam(team1Line, teamsFromTag?.[0] || '')}\n${formatTeam(team2Line, teamsFromTag?.[1] || '')}`;
    return formatted.trim();
  }

module.exports = function setupLineupChecker(client) {
  async function checkRSSAndSend() {
    try {
      const feed = await parser.parseURL(RSS_URL);
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (!channel || !channel.isTextBased()) {
        return console.warn('[WARN] Discord channel not found or not text-based.');
      }

      const now = Date.now();
      let newPosts = 0;

      for (const item of feed.items) {
        const content = item.content || '';
        const pubDate = new Date(item.isoDate).getTime();

        if (
            content.trim().startsWith('LINE-UPS') &&
            pubDate <= now &&
            now - pubDate <= 65000
        ) {
          const message = formatLineupMessage(content);
          await channel.send(message);
          console.log(`[SEND] Sent LINE-UPS post published at ${item.pubDate}`);
          newPosts++;
        }
      }

      if (newPosts === 0) {
        console.log('[INFO] No new LINE-UPS posts in the last minute.');
      }
    } catch (err) {
      console.error('[ERROR] Failed RSS check:', err.message);
    }
  }

  async function parseICSAndScheduleRSSChecks() {
    try {
      const response = await axios.get(ICS_URL);
      const events = ical.parseICS(response.data);
      const now = new Date();
      const today = getTodayDate();
      const todaysEvents = [];

      for (const key in events) {
        const event = events[key];
        if (event.type !== 'VEVENT') continue;
        if (!event.summary?.startsWith('⚽️')) continue;

        const eventDate = event.start.toISOString().slice(0, 10);
        if (eventDate !== today) continue;

        const rssStart = new Date(event.start.getTime() - 75 * 60000);
        if (rssStart > now) scheduleRSSWindow(rssStart, event.summary, checkRSSAndSend);

        todaysEvents.push({
          summary: event.summary,
          start: event.start.toISOString(),
          end: event.end?.toISOString() || null,
        });
      }

      saveDailyEvents(todaysEvents);
    } catch (err) {
      console.error('[ERROR] Failed to parse ICS:', err.message);
    }
  }

  // When setupLineupChecker() is called, run: 
  parseICSAndScheduleRSSChecks()
};