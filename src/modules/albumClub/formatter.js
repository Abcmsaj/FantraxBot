function truncate(text, limit) {
    if (!text) return '';
    const value = String(text).trim();
    if (value.length <= limit) return value;
    return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function buildAlbumPost({ requestedBy, answers }) {
    const links = Array.isArray(answers.links) ? answers.links.filter(Boolean) : [];
    const linkBlock = links.length ? links.map(link => `- ${link}`).join('\n') : '-';

    return [
        `**User:** ${requestedBy}`,
        `**Artist:** ${truncate(answers.artist, 120)}`,
        `**Album:** ${truncate(answers.album, 120)}`,
        `**Year:** ${truncate(answers.year, 20)}`,
        `**Genre:** ${truncate(answers.genre, 80)}`,
        '',
        `**Why should we listen to it?:**`,
        truncate(answers.whyListen, 1800) || '-',
        '',
        `**Favourite track:**`,
        truncate(answers.favouriteTrack, 200) || '-',
        '',
        `**Spotify/Apple Music/YouTube link:**`,
        linkBlock,
    ].join('\n');
}

function buildThreadName(artist, album) {
    const raw = `${artist} - ${album}`.replace(/\s+/g, ' ').trim();
    return raw.slice(0, 100);
}

function parseLinks(raw) {
    if (!raw) return [];
    return String(raw)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, 6);
}

module.exports = {
    buildAlbumPost,
    buildThreadName,
    parseLinks,
    truncate,
};
