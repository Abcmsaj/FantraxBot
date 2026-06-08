const path = require('path');

function loadConfig() {
    try {
        return require('../../../FantraxConfig/config.json');
    } catch (err) {
        return {};
    }
}

const config = loadConfig();

function fromConfigOrEnv(configKey, envKey, fallback = null) {
    return config[configKey] ?? process.env[envKey] ?? fallback;
}

module.exports = {
    GUILD_ID: fromConfigOrEnv('guildId', 'GUILD_ID'),
    FORUM_CHANNEL_ID: fromConfigOrEnv('albumClubChannel', 'ALBUM_CLUB_CHANNEL_ID', fromConfigOrEnv('albumClubForumChannelId', 'ALBUM_CLUB_FORUM_CHANNEL_ID')),
    RECENT_FILE: path.join(__dirname, '../../json/albumRecent.json'),
    PENDING_FILE: path.join(__dirname, '../../json/albumPending.json'),
    HISTORY_FILE: path.join(__dirname, '../../json/albumHistory.json'),
    RECENT_LIMIT: Number(fromConfigOrEnv('albumClubRecentLimit', 'ALBUM_CLUB_RECENT_LIMIT', 7)),
    ROUND_DAYS: Number(fromConfigOrEnv('albumClubRoundDays', 'ALBUM_CLUB_ROUND_DAYS', 7)),
    SELECTION_CRON: fromConfigOrEnv('albumClubSelectionCron', 'ALBUM_CLUB_SELECTION_CRON', '0 12 * * 6'),
    FINALIZE_CRON: fromConfigOrEnv('albumClubFinalizeCron', 'ALBUM_CLUB_FINALIZE_CRON', '15 0 * * *'),
    QUESTIONS: [
        'What artist should we listen to?',
        'What is the album title?',
        'What year was it released?',
        'What genre should we call it? Separate each genre with commas.',
        'Why should we listen to it?',
        'What is your favourite track?',
        'Send links for Spotify, Apple Music, YouTube, or anything else useful. One per line is fine.'
    ]
};
