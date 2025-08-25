const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeArticle() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
    });
    const page = await browser.newPage();

    const url = 'https://www.ft.com/content/12345678-1234-1234-1234-1234567890ab'; // Replace with a real article URL
    console.log('Navigating to article:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Check for paywall
    const isPaywalled = await page.evaluate(() => {
      return document.querySelector('.paywall-overlay, .article-paywall, [data-paywall]') !== null;
    });

    if (isPaywalled) {
      console.log('Paywall detected, attempting to bypass...');
      await page.evaluate(() => {
        // Remove paywall overlay
        const paywall = document.querySelector('.paywall-overlay, .article-paywall, [data-paywall]');
        if (paywall) paywall.remove();

        // Unhide content
        const content = document.querySelector('.article__content-body, .story-body');
        if (content) content.style.display = 'block';
      });
    }

    // Wait for content to stabilize
    await page.waitForTimeout(2000);

    // Extract article data
    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('h1.article__title, h1')?.innerText || 'No title',
        body: document.querySelector('.article__content-body, .story-body')?.innerText || 'No body',
        date: document.querySelector('time[data-trackable="date"]')?.innerText || 'No date',
        author: document.querySelector('.article__author, .byline')?.innerText || 'No author'
      };
    });

    console.log('Scraped data:', data);
    await browser.close();
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
  }
}

scrapeArticle();