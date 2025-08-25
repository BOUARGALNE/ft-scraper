const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const Parser = require('rss-parser');
const parser = new Parser();
const fs = require('fs').promises;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Configuration
const config = {
  feedUrls: ['https://www.ft.com/world?format=rss', 'https://www.ft.com/companies?format=rss'],
  maxConcurrent: 5,
  limit: 20,
  proxies: [null], // Add your proxies: ['http://user:pass@proxy1:port', ...]
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  ]
};

// Launch browser with random user-agent and optional proxy
async function launchBrowser(proxy = null) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    `--user-agent=${config.userAgents[Math.floor(Math.random() * config.userAgents.length)]}`
  ];
  if (proxy) args.push(`--proxy-server=${proxy}`);
  return await puppeteer.launch({ headless: true, args });
}

// Scrape a single article
async function scrapeArticle(page, url, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Remove paywall elements
      await page.evaluate(() => {
        const paywall = document.querySelector('.paywall-overlay, .article-paywall, [data-paywall]');
        if (paywall) paywall.remove();
        const content = document.querySelector('.article__content-body, .story-body');
        if (content) content.style.display = 'block';
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = await page.evaluate(() => ({
        url: window.location.href,
        title: document.querySelector('h1.article__title, h1')?.innerText || 'No title',
        body: document.querySelector('.article__content-body, .story-body')?.innerText || 'No body',
        date: document.querySelector('time[data-trackable="date"]')?.innerText || 'No date',
        author: document.querySelector('.article__author, .byline')?.innerText || 'No author'
      }));
      
      console.log(`Scraped: ${data.title}`);
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}: ${error.message}`);
      if (attempt === retries) return null;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// Fetch article URLs from RSS feeds
async function getArticleUrls(feeds = config.feedUrls, limit = config.limit) {
  let allUrls = [];
  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      console.log(`Fetched RSS feed: ${feed.title}`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const urls = feed.items
        .filter(item => new Date(item.pubDate) >= today)
        .slice(0, limit)
        .map(item => item.link);
      allUrls.push(...urls);
    } catch (error) {
      console.error(`Error fetching RSS ${feedUrl}: ${error.message}`);
    }
  }
  return [...new Set(allUrls)].slice(0, limit); // Deduplicate
}

// Save to JSON
async function saveToJson(articles) {
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile('articles.json', 'utf-8'));
  } catch (error) {
    console.log('No existing JSON file, creating new.');
  }
  const existingUrls = new Set(existing.map(a => a.url));
  const newArticles = articles.filter(a => !existingUrls.has(a.url));
  const updated = [...existing, ...newArticles];
  await fs.writeFile('articles.json', JSON.stringify(updated, null, 2));
  console.log(`Saved ${newArticles.length} new articles to JSON`);
}

// Save to CSV
async function saveToCsv(articles) {
  const csvWriter = createCsvWriter({
    path: 'articles.csv',
    header: [
      { id: 'url', title: 'URL' },
      { id: 'title', title: 'Title' },
      { id: 'body', title: 'Body' },
      { id: 'date', title: 'Date' },
      { id: 'author', title: 'Author' }
    ],
    append: true
  });
  
  let existing = [];
  try {
    const existingData = await fs.readFile('articles.csv', 'utf-8');
    existing = existingData.split('\n').slice(1).map(row => row.split(',')[0]);
  } catch (error) {
    console.log('No existing CSV, creating new.');
  }
  
  const newArticles = articles.filter(a => !existing.includes(a.url));
  if (newArticles.length > 0) {
    await csvWriter.writeRecords(newArticles);
    console.log(`Saved ${newArticles.length} new articles to CSV`);
  }
}

// Swarm scraping
async function swarmScrape() {
  const browser = await launchBrowser(config.proxies[Math.floor(Math.random() * config.proxies.length)]);
  const urls = await getArticleUrls();
  const results = [];

  for (let i = 0; i < urls.length; i += config.maxConcurrent) {
    const batch = urls.slice(i, i + config.maxConcurrent);
    console.log(`Scraping batch ${i / config.maxConcurrent + 1} of ${Math.ceil(urls.length / config.maxConcurrent)}`);
    
    const pages = await Promise.all(
      Array(config.maxConcurrent).fill().map(() => browser.newPage())
    );
    
    const batchResults = await Promise.all(
      batch.map(async (url, index) => {
        const page = pages[index % config.maxConcurrent];
        return await scrapeArticle(page, url);
      })
    );
    
    results.push(...batchResults.filter(result => result !== null));
    await Promise.all(pages.map(page => page.close()));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();
  if (results.length > 0) {
    await saveToJson(results);
    await saveToCsv(results);
  }
  console.log(`Swarm scrape complete. Scraped ${results.length} articles.`);
  return results;
}

module.exports = { swarmScrape };