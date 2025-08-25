const cron = require('node-cron');
const { swarmScrape } = require('./scraper');

// Run immediately for testing
swarmScrape().then(() => console.log('Initial scrape complete')).catch(err => console.error('Initial scrape failed:', err.message));

// Schedule daily at midnight (UTC)
cron.schedule('0 0 * * *', async () => {
  console.log('Starting daily scrape:', new Date().toISOString());
  try {
    await swarmScrape();
    console.log('Daily scrape completed successfully');
  } catch (error) {
    console.error('Daily scrape failed:', error.message);
    await require('fs').promises.appendFile('errors.log', `${new Date().toISOString()} - ${error.message}\n`);
  }
});

console.log('Scheduler started. Waiting for next run...');