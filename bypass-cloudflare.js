const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testCloudflareBypass() {
  try {
    const browser = await puppeteer.launch({
      headless: false, // Set to true in production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      ]
    });
    const page = await browser.newPage();

    // Optional: Add proxy if you have one (from .env)
    // await page.authenticate({ username: 'proxy-user', password: 'proxy-pass' });

    console.log('Navigating to FT.com...');
    await page.goto('https://www.ft.com', { waitUntil: 'networkidle2', timeout: 60000 });

    // Check if Cloudflare challenge appears
    const isCloudflareBlocked = await page.evaluate(() => {
      return document.querySelector('input[name="cf-turnstile-response"]') !== null;
    });

    if (isCloudflareBlocked) {
      console.log('Cloudflare challenge detected. Manual intervention or CAPTCHA solver needed.');
      // For now, pause to inspect manually
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('Successfully bypassed Cloudflare! Page title:', await page.title());
    }

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCloudflareBypass();