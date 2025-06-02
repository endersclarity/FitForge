const puppeteer = require('puppeteer');

async function debugFitForge() {
    let browser;
    try {
        console.log('Starting browser with console logging...');
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            devtools: true
        });
        
        const page = await browser.newPage();
        
        // Set up console and error listeners
        const consoleMessages = [];
        const errors = [];
        
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            consoleMessages.push({ type, text });
            console.log(`Console ${type}:`, text);
        });
        
        page.on('pageerror', error => {
            errors.push(error.message);
            console.log('Page error:', error.message);
        });
        
        page.on('requestfailed', request => {
            console.log('Failed request:', request.url(), request.failure().errorText);
        });
        
        // Set viewport
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('Navigating to FitForge...');
        await page.goto('https://fitforge-free-9zezd.ondigitalocean.app', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait longer for React to initialize
        console.log('Waiting for React app to initialize...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check React mounting
        const reactInfo = await page.evaluate(() => {
            const root = document.getElementById('root');
            return {
                rootExists: !!root,
                rootHasChildren: root ? root.children.length > 0 : false,
                rootHTML: root ? root.innerHTML.substring(0, 200) : 'No root',
                documentReady: document.readyState,
                scriptTags: document.querySelectorAll('script').length,
                styleTags: document.querySelectorAll('link[rel="stylesheet"]').length
            };
        });
        
        console.log('React mounting info:', reactInfo);
        
        // Check for specific elements after more time
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const elementCheck = await page.evaluate(() => {
            return {
                hasNavigation: !!document.querySelector('nav'),
                hasHeader: !!document.querySelector('header'),
                hasMain: !!document.querySelector('main'),
                hasButtons: document.querySelectorAll('button').length,
                hasLinks: document.querySelectorAll('a').length,
                hasInputs: document.querySelectorAll('input').length,
                bodyClasses: document.body.className,
                bodyText: document.body.innerText.trim().substring(0, 100)
            };
        });
        
        console.log('Element check:', elementCheck);
        
        // Check for error boundaries or loading states
        const errorBoundaryCheck = await page.evaluate(() => {
            const possibleErrors = [];
            const textContent = document.body.textContent.toLowerCase();
            
            if (textContent.includes('something went wrong')) possibleErrors.push('Error boundary triggered');
            if (textContent.includes('loading')) possibleErrors.push('Stuck in loading state');
            if (textContent.includes('not found')) possibleErrors.push('Not found error');
            
            return {
                possibleErrors,
                bodyTextLength: document.body.textContent.length,
                hasReactDevtools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
            };
        });
        
        console.log('Error boundary check:', errorBoundaryCheck);
        
        // Final summary
        console.log('\n--- SUMMARY ---');
        console.log('Console messages:', consoleMessages.length);
        console.log('JavaScript errors:', errors.length);
        console.log('React root found:', reactInfo.rootExists);
        console.log('React has content:', reactInfo.rootHasChildren);
        console.log('Navigation elements:', elementCheck.hasNavigation);
        console.log('Interactive elements:', elementCheck.hasButtons + elementCheck.hasLinks);
        
        if (errors.length > 0) {
            console.log('\n--- ERRORS ---');
            errors.forEach(error => console.log(error));
        }
        
        if (consoleMessages.some(msg => msg.type === 'error')) {
            console.log('\n--- CONSOLE ERRORS ---');
            consoleMessages.filter(msg => msg.type === 'error').forEach(msg => console.log(msg.text));
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/home/ender/fitforge_debug_' + Date.now() + '.png',
            fullPage: true 
        });
        
        // Keep browser open for manual inspection
        console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('Script error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugFitForge();