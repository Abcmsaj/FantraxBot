const fs = require('fs');
const axios = require('axios');
const ical = require('node-ical');
const RSSParser = require('rss-parser');
const schedule = require('node-schedule');
const { Client, GatewayIntentBits } = require('discord.js');
const { lineupsChannel, rssFeed } = require('../FantraxConfig/config.json');

const CHANNEL_ID = lineupsChannel;
const ICS_URL = rssFeed;
const RSS_URL = 'https://bsky.app/profile/ffscoutfpl.bsky.social/rss';
const DAILY_EVENTS_FILE = './lineupEvents.json';
const SENT_POSTS_FILE = './lineupSentPosts.json';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const parser = new RSSParser();
let sentPosts = new Set();

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function readJSONFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (e) {
    console.error(`[ERROR] Could not parse ${filePath}:`, e.message);
    return null;
  }
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadSentPosts() {
  const today = getTodayDate();
  const data = readJSONFile(SENT_POSTS_FILE);
  sentPosts = new Set(data?.[today] || []);
  console.log(`[INFO] Loaded sent posts for ${today}.`);
}

function saveSentPosts() {
  const today = getTodayDate();
  const data = readJSONFile(SENT_POSTS_FILE) || {};
  data[today] = [...sentPosts];
  writeJSONFile(SENT_POSTS_FILE, data);
}

function saveDailyEvents(events) {
  writeJSONFile(DAILY_EVENTS_FILE, events);
  console.log(`[SAVE] Saved ${events.length} events to ${DAILY_EVENTS_FILE}`);
}

function scheduleRSSWindow(startTime, eventSummary) {
  console.log(`[SCHEDULE] RSS check window for "${eventSummary}" at ${startTime.toISOString()}`);
  for (let i = 0; i < 15; i++) {
    const checkTime = new Date(startTime.getTime() + i * 60000);
    schedule.scheduleJob(checkTime, () => {
      console.log(`[CHECK] RSS check at ${checkTime.toISOString()} for "${eventSummary}"`);
      checkRSSAndSend();
    });
  }
}

  function formatLineupMessage(description) {
    const emojiMapFromTag = (tag) => {
        const map = {
          ARS: '⭕', AVL: '🟣', BRE: '🐝', BHA: '🕊', BOU: '🍒', BUR: '', CHE: '🧿',
          CRY: '🦅', EVE: '🍬', FUL: '⬜', IPS: '🚜', LEE: '', LEI: '🦊', LIV: '🔴', MCI: '🔵',
          MUN: '👹', NEW: '⚫', NFO: '🌳', SHU: '', SOU: '😇', SUN: '', TOT: '🐓', WHU: '⚒', WOL: '🐺'
        };
        return map[tag.toUpperCase()] || '';
      };

    const matchTagMatch = description.match(/\|\s(#\w+)/);
    const tag = matchTagMatch?.[1] || '#MATCH';
  
    const teamsFromTag = tag.slice(1).match(/.{3}/g); // e.g. 'BREFUL' => ['BRE', 'FUL']
    const lines = description.split(/\s(?=[A-Z]{2,3}:)/g);
    const [_, team1Line, team2Line] = lines;
  
    const formatTeam = (line, teamCode) => {
      if (!line) return '';
      const [_, ...players] = line.split(/:|, /);
      const emoji = emojiMapFromTag(teamCode);
      return `${emoji ? emoji + ' ' : ''}${teamCode}: ${players.join(', ').trim()}`;
    };
  
    const formatted = `LINE-UPS | ${tag}\n${formatTeam(team1Line, teamsFromTag?.[0] || '')}\n${formatTeam(team2Line, teamsFromTag?.[1] || '')}`;
    return formatted.trim();
  }
  
async function checkRSSAndSend() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.warn('[WARN] Discord channel not found.');

    let newPosts = 0;
    for (const item of feed.items) {
      const description = item.description || '';
      const id = item.guid || item.link || description;

      if (description.startsWith('LINE-UPS') && !sentPosts.has(id)) {
        sentPosts.add(id);
        const message = formatLineupMessage(description);
        await channel.send(message);
        console.log(`[SEND] Sent LINE-UPS post: ${description}`);
        newPosts++;
      }
    }
    if (newPosts > 0) saveSentPosts();
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
      if (rssStart > now) scheduleRSSWindow(rssStart, event.summary);

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

loadSentPosts();

module.exports = { parseICSAndScheduleRSSChecks };
