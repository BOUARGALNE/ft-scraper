FT.com Article Scraper
This project is a Node.js-based web scraper for extracting articles from the Financial Times (FT.com) using Puppeteer. It fetches article URLs from FT's RSS feeds, scrapes content in parallel using a "swarm" approach, bypasses Cloudflare and paywall protections, and stores data in MongoDB, JSON, and CSV formats. The scraper runs daily via a cron scheduler.
⚠️ Legal Notice: Web scraping may violate FT.com's terms of service, copyright laws, or anti-bot protections. This project is for educational purposes only. Ensure compliance with applicable laws and FT.com's terms before use. Consider using FT's official API or licensed data feeds as alternatives. Use at your own risk.
Features

Fetches article URLs from FT.com RSS feeds (e.g., World and Companies sections).
Scrapes article title, body, date, and author using Puppeteer with stealth plugins.
Bypasses Cloudflare using FlareSolverr and proxy rotation.
Attempts paywall bypass with referrer spoofing and bypass-paywalls-chrome extension.
Parallel scraping with configurable concurrency using puppeteer-cluster.
Stores data in MongoDB, JSON, and CSV with deduplication.
Schedules daily runs at midnight UTC using node-cron.
Includes retry logic and error logging for robustness.

Prerequisites

Node.js: v18 or higher.
MongoDB: Local or cloud instance (e.g., MongoDB Atlas).
Docker: For running FlareSolverr.
Proxy Service: Rotating proxies (e.g., Bright Data, Oxylabs) to avoid IP bans.
bypass-paywalls-chrome: Browser extension for paywall bypass.

Installation

Clone the repository:
git clone https://github.com/your-username/ft-scraper.git
cd ft-scraper


Install dependencies:
npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-cluster rss-parser mongoose axios dotenv csv-writer node-cron


Set up FlareSolverr:
docker run -d -p 8191:8191 flaresolverr/flaresolverr

Verify it’s running with docker ps.

Download bypass-paywalls-chrome:

Clone or download from iamadamdev/bypass-paywalls-chrome.
Unzip and update the extensionPath in swarm-scraper.js to the extension folder path.


Configure environment variables:Create a .env file in the project root:
MONGO_URL=mongodb://localhost:27017
PROXY_URLS=http://user:pass@proxy1:port,http://user:pass@proxy2:port


Replace MONGO_URL with your MongoDB connection string.
Add proxy URLs from your proxy service (optional but recommended).


Set up MongoDB:

Install MongoDB locally or use a cloud instance.
Ensure the ft_articles database is accessible.



Usage

Run the scraper manually:
node swarm-scraper.js

This scrapes up to 20 articles from FT.com RSS feeds, saves them to MongoDB, articles.json, and articles.csv, and logs errors to errors.log.

Check output:

MongoDB: Connect to ft_articles database and query db.articles.find().
JSON: Check articles.json for raw data.
CSV: Check articles.csv for tabular data.
Logs: Review errors.log for issues.


Scheduler:

The script includes a cron job that runs daily at midnight UTC.
Start the scheduler with:node swarm-scraper.js


To run in the background, use a process manager like PM2:npm install -g pm2
pm2 start swarm-scraper.js --name ft-scraper





Configuration
Edit the config object in swarm-scraper.js:

feedUrls: Array of FT.com RSS feeds to scrape.
maxConcurrent: Number of concurrent browser instances (default: 4).
limit: Maximum articles to scrape per run (default: 20).
mongoUrl: MongoDB connection string (from .env).
proxies: Array of proxy URLs (from .env).
userAgents: Array of user-agents for rotation.
extensionPath: Path to bypass-paywalls-chrome folder.

Troubleshooting

Cloudflare Blocks: Ensure FlareSolverr is running (docker ps) and proxies are configured. Test with a single URL.
Paywall Issues: Verify the bypass-paywalls-chrome extension path and try alternative referrers (e.g., https://www.bing.com/).
MongoDB Errors: Check connection string and ensure MongoDB is running.
High Resource Usage: Reduce maxConcurrent in config.
Selector Failures: FT.com may update selectors. Inspect articles in a browser and update .article__content-body, .story-body, etc., in scrapeArticle.

Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.
Disclaimer
This project is for educational purposes only. Scraping FT.com may violate their terms of service or applicable laws. The author is not responsible for any misuse or legal consequences. Always seek permission from FT.com or use their official API for data access.