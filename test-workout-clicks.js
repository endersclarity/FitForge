// Test workout card clicking with browser automation
const puppeteer = require('puppeteer');

async function testWorkoutClicks() {
    const browser = await puppeteer.launch({
        headless: false,  // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome-stable'  // WSL Chrome path
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages from React app
    page.on('console', msg => {
        console.log('🖥️ Browser Console:', msg.text());
    });
    
    try {
        console.log('🌐 Navigating to FitForge workouts page...');
        await page.goto('http://localhost:5000/workouts', { waitUntil: 'networkidle0' });
        
        console.log('📸 Taking screenshot...');
        await page.screenshot({ path: 'workouts-page.png' });
        
        console.log('🔍 Looking for workout cards...');
        const cardElements = await page.$$('[data-workout-id], .cursor-pointer');
        console.log(`Found ${cardElements.length} potential clickable elements`);
        
        // Try clicking the first workout card
        console.log('🖱️ Attempting to click first workout card...');
        const firstCard = await page.$('.cursor-pointer');
        if (firstCard) {
            await firstCard.click();
            console.log('✅ Clicked first workout card');
            
            // Wait a moment for navigation
            await page.waitForTimeout(2000);
            
            // Check current URL
            const currentUrl = page.url();
            console.log('🧭 Current URL after click:', currentUrl);
            
            if (currentUrl.includes('start-workout')) {
                console.log('✅ Navigation successful!');
            } else {
                console.log('❌ Navigation failed - still on:', currentUrl);
            }
        } else {
            console.log('❌ No clickable workout card found');
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testWorkoutClicks();