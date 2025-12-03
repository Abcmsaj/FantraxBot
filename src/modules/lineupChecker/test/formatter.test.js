// modules/lineupChecker/test/formatter.test.js
const { formatLineupMessage } = require('../formatter');

// Test different #FPL variants and emoji removal
const tests = [
  {
    name: 'basic #FPL strip',
    input: 'LINE-UPS | #ARSTOT ARS: Player A, Player B #FPL TOT: Player C, Player D',
    expectedIncludes: 'ARS: Player A, Player B',
  },
  {
    name: '#FPL plus hashtag',
    input: 'LINE-UPS | #ARSTOT ARS: Player A, Player B #FPL #Football TOT: Player C, Player D',
    expectedIncludes: 'ARS: Player A, Player B',
  },
  {
    name: 'emoji stripping',
    input: 'LINE-UPS | #ARSTOT ARS: Player A, Player B #FPL 🔥 TOT: Player C, Player D',
    expectedIncludes: 'ARS: Player A, Player B',
  },
];

tests.forEach(({ name, input, expectedIncludes }) => {
  const msg = formatLineupMessage(input);
  console.assert(msg.includes(expectedIncludes), `[FAIL] ${name}`);
});
console.log('[PASS] formatter.test.js');
