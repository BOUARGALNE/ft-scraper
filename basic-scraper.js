const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const Parser = require('rss-parser');
const parser = new Parser();

async function launchBrowser() {
  return await puppeteer.launch({
    headless: false, 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
  });
}

async function scrapeArticle(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => {
      const paywall = document.querySelector('.paywall-overlay, .article-paywall, [data-paywall]');
      if (paywall) paywall.remove();
      const content = document.querySelector('.article__content-body, .story-body');
      if (content) content.style.display = 'block';
    });

    await page.waitForTimeout(2000); 

    const data = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.querySelector('h1.article__title, h1')?.innerText || 'No title',
        body: document.querySelector('.article__content-body, .story-body')?.innerText || 'No body',
        date: document.querySelector('time[data-trackable="date"]')?.innerText || 'No date',
        author: document.querySelector('.article__author, .byline')?.innerText || 'No author'
      };
    });

    console.log(`Scraped: ${data.title}`);
    return data;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

async function basicScrape(feedUrl = 'https://www.ft.com/world?format=rss', limit = 3) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const urls = await getArticleUrls(feedUrl, limit);

  const results = [];
  for (const url of urls) {
    const data = await scrapeArticle(page, url);
    if (data) results.push(data);
    await page.waitForTimeout(2000); 
  }

  await browser.close();
  console.log('Scraping complete. Results:', results);
  return results;
}

async function getArticleUrls(feedUrl, limit) {
  const feed = await parser.parseURL(feedUrl);
  return feed.items.slice(0, limit).map(item => item.link);
}

basicScrape();