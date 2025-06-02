const puppeteer = require('puppeteer');

async function quickTest() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://fitforge-free-9zezd.ondigitalocean.app');
  
  // Wait 3 seconds for React to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const content = await page.evaluate(() => {
    return {
      title: document.title,
      bodyText: document.body.innerText,
      hasRoot: !!document.getElementById('root'),
      rootContent: document.getElementById('root')?.innerHTML || 'EMPTY'
    };
  });
  
  console.log('RESULT:', content);
  await browser.close();
}

quickTest();