const Parser = require('rss-parser');
const parser = new Parser();

async function getArticleUrls(feedUrl, limit = 5) {
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`Fetched RSS feed: ${feed.title}`);
    const urls = feed.items.slice(0, limit).map(item => item.link);
    console.log(`Found ${urls.length} article URLs:`);
    urls.forEach(url => console.log(url));
    return urls;
  } catch (error) {
    console.error('Error fetching RSS:', error.message);
    return [];
  }
}

// Test with World section
getArticleUrls('https://www.ft.com/world?format=rss', 5);