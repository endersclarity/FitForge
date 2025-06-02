const puppeteer = require('puppeteer');

async function testLocalFix() {
    let browser;
    try {
        console.log('Testing local production build...');
        browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set up error logging
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
            console.log('❌ Page error:', error.message);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console error:', msg.text());
            } else {
                console.log('📝 Console:', msg.type(), msg.text());
            }
        });
        
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('Navigating to local build...');
        await page.goto('http://172.22.206.209:3001', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for React to initialize
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check if the app loaded correctly
        const appStatus = await page.evaluate(() => {
            const root = document.getElementById('root');
            const hasContent = root && root.children.length > 0;
            const bodyText = document.body.innerText.trim();
            
            return {
                rootExists: !!root,
                hasContent,
                bodyText: bodyText.substring(0, 200),
                hasNavigation: !!document.querySelector('nav'),
                hasButtons: document.querySelectorAll('button').length,
                title: document.title
            };
        });
        
        console.log('Local app status:', appStatus);
        
        if (appStatus.hasContent) {
            console.log('✅ Local fix appears to work! App has content.');
            
            // Test navigation if available
            if (appStatus.hasNavigation) {
                console.log('✅ Navigation found, testing basic interaction...');
                try {
                    const navLinks = await page.$$eval('nav a', links => 
                        links.map(link => ({ text: link.textContent, href: link.href }))
                    );
                    console.log('Navigation links:', navLinks);
                } catch (e) {
                    console.log('Could not get nav links:', e.message);
                }
            }
        } else {
            console.log('❌ Local fix did not work - no content rendered');
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: '/home/ender/local_fix_test.png',
            fullPage: true 
        });
        console.log('Screenshot saved as local_fix_test.png');
        
        // Summary
        console.log('\n--- LOCAL TEST SUMMARY ---');
        console.log('Errors detected:', errors.length);
        console.log('Content rendered:', appStatus.hasContent);
        console.log('Navigation present:', appStatus.hasNavigation);
        console.log('Interactive elements:', appStatus.hasButtons);
        
        if (errors.length === 0 && appStatus.hasContent) {
            console.log('🎉 Fix successful! Ready to deploy.');
            return true;
        } else {
            console.log('❌ Fix needs more work.');
            return false;
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testLocalFix().then(success => {
    console.log(success ? '✅ Test passed' : '❌ Test failed');
    process.exit(success ? 0 : 1);
});