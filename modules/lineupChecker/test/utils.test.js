// modules/lineupChecker/test/utils.test.js
const fs = require('fs');
const { getTodayDate, writeJSONFile } = require('../utils');
const tmpFile = './modules/lineupChecker/test/temp.json';

writeJSONFile(tmpFile, { test: true });
const loaded = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));

console.assert(loaded.test === true, 'writeJSONFile did not write correctly');
console.assert(getTodayDate().length === 10, 'getTodayDate format incorrect');
console.log('[PASS] utils.test.js');
