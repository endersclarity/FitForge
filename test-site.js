const puppeteer = require('puppeteer');

async function testFitForge() {
  console.log('🔍 Testing FitForge production site...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to https://fitforge-free-9zezd.ondigitalocean.app');
    await page.goto('https://fitforge-free-9zezd.ondigitalocean.app', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Check if page has content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('📝 Page content length:', bodyText.length);
    console.log('📝 First 200 characters:', bodyText.substring(0, 200));
    
    // Check for React root
    const hasRoot = await page.$('#root');
    console.log('⚛️  React root found:', !!hasRoot);
    
    // Get console errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    // Wait a bit for any async content
    await page.waitForTimeout(2000);
    
    console.log('🚨 Console messages:', consoleMessages);
    
    // Check if specific FitForge content is present
    const hasFitForgeContent = await page.evaluate(() => {
      return document.body.innerText.includes('FitForge') || 
             document.body.innerText.includes('Fitness') ||
             document.body.innerText.includes('Transform');
    });
    
    console.log('💪 Has FitForge content:', hasFitForgeContent);
    
  } catch (error) {
    console.error('❌ Error testing site:', error.message);
  } finally {
    await browser.close();
  }
}

testFitForge().catch(console.error);