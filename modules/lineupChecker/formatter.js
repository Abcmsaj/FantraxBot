function emojiMapFromTag(tag) {
  const map = {
    ARS: '⭕', AVL: '🟣', BRE: '🐝', BHA: '🕊', BOU: '🍒', BUR: '', CHE: '🧿',
    CRY: '🦅', EVE: '🍬', FUL: '⬜', IPS: '🚜', LEE: '', LEI: '🦊', LIV: '🔴', MCI: '🔵',
    MUN: '👹', NEW: '⚫', NFO: '🌳', SHU: '', SOU: '😇', SUN: '🐈', TOT: '🐓', WHU: '⚒', WOL: '🐺'
  };
  return map[tag.toUpperCase()] || '';
}

function formatLineupMessage(content) {
  const matchTagMatch = content.match(/\|\s(#\w+)/);
  const tag = matchTagMatch?.[1] || '';
  const teamsFromTag = tag.slice(1).match(/.{3}/g);
  const lines = content.split(/\s(?=[A-Z]{2,3}:)/g);
  const [_, team1Line, team2Line] = lines;

  const formatTeam = (line, teamCode) => {
    const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])+|\uFE0F|\u200D/gu;
    const cleanLine = line.replace(emojiRegex, ''); // remove all emoji from the line

    const parts = cleanLine.split(/:|, /);
    const players = parts.slice(1).join(', ').replace(/\s+#FPL.*$/, '').trim();

    const emoji = emojiMapFromTag(teamCode);
    return `${emoji ? emoji + ' ' : ''}${teamCode}: ${players}`;
  };

  return [
    'LINE-UPS | ' + tag,
    '_ _',
    formatTeam(team1Line, teamsFromTag?.[0] || ''),
    formatTeam(team2Line, teamsFromTag?.[1] || ''),
    '_ _'
  ].join('\n').trim();
}

module.exports = { formatLineupMessage };