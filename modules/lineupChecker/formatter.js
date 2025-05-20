function emojiMapFromTag(tag) {
    const map = {
      ARS: '⭕', AVL: '🟣', BRE: '🐝', BHA: '🕊', BOU: '🍒', BUR: '', CHE: '🧿',
      CRY: '🦅', EVE: '🍬', FUL: '⬜', IPS: '🚜', LEE: '', LEI: '🦊', LIV: '🔴', MCI: '🔵',
      MUN: '👹', NEW: '⚫', NFO: '🌳', SHU: '', SOU: '😇', SUN: '', TOT: '🐓', WHU: '⚒', WOL: '🐺'
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
      if (!line) return '';
      let parts = line.split(/:|, /);
      let players = parts.slice(1).join(', ').replace(/\s+#FPL$/, '').trim();
      players = players.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]+$/u, '').trim();
      const emoji = emojiMapFromTag(teamCode);
      return `${emoji ? emoji + ' ' : ''}${teamCode}: ${players}`;
    };
  
    return `LINE-UPS | ${tag}\n${formatTeam(team1Line, teamsFromTag?.[0] || '')}\n${formatTeam(team2Line, teamsFromTag?.[1] || '')}`.trim();
  }
  
  module.exports = { formatLineupMessage };