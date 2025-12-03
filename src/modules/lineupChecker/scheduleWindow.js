const schedule = require('node-schedule');

function scheduleRSSWindow(startTime, eventSummary, checkRSSAndSend, scheduledJobs, client) {
  const key = `${eventSummary}-${startTime.toISOString()}`;
  if (scheduledJobs.has(key)) return;
  scheduledJobs.add(key);

  console.log(`<Lineup Checker> [SCHEDULE] RSS check window for "${eventSummary}" at ${startTime.toISOString()}`);
  for (let i = 0; i < 15; i++) {
    const checkTime = new Date(startTime.getTime() + i * 60000);
    schedule.scheduleJob(checkTime, () => {
      console.log(`<Lineup Checker> [CHECK] RSS check at ${checkTime.toISOString()} for "${eventSummary}"]`);
      checkRSSAndSend(client);
    });
  }
}

module.exports = { scheduleRSSWindow };