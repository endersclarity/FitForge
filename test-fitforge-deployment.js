const puppeteer = require('puppeteer');

async function testFitForge() {
    let browser;
    try {
        console.log('Starting browser...');
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('Navigating to FitForge...');
        await page.goto('https://fitforge-free-9zezd.ondigitalocean.app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for React to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get page title
        const title = await page.title();
        console.log('Page title:', title);
        
        // Check if React root is present
        const reactRoot = await page.$('#root');
        console.log('React root found:', !!reactRoot);
        
        // Get text content to see what's loaded
        const bodyText = await page.evaluate(() => {
            return document.body.innerText.substring(0, 500);
        });
        console.log('Page content preview:', bodyText);
        
        // Check for navigation elements
        const navExists = await page.evaluate(() => {
            return document.querySelector('nav') !== null;
        });
        console.log('Navigation found:', navExists);
        
        // Check for specific FitForge elements
        const buttons = await page.$$eval('button', buttons => buttons.length);
        console.log('Number of buttons found:', buttons);
        
        const links = await page.$$eval('a', links => links.length);
        console.log('Number of links found:', links);
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/ender/fitforge_live.png',
            fullPage: true 
        });
        console.log('Screenshot saved as fitforge_live.png');
        
        // Check console errors
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (logs.length > 0) {
            console.log('Console messages:', logs);
        }
        
    } catch (error) {
        console.error('Error testing FitForge:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testFitForge();