const puppeteer = require('puppeteer');

async function checkFitForge() {
    console.log('🚀 Starting browser...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        console.log('📱 Page created');
        
        console.log('🌐 Navigating to FitForge...');
        await page.goto('https://fitforge-free-9zezd.ondigitalocean.app', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('⏳ Waiting for React to load...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Check if React root exists
        const rootExists = await page.$('#root');
        console.log(`⚛️  React root: ${rootExists ? 'Found' : 'Not found'}`);
        
        // Get page content
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log(`📝 Body text length: ${bodyText.length} characters`);
        
        // Look for debug component
        const debugContent = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const h2 = document.querySelector('h2');
            const h3 = document.querySelector('h3');
            
            if (h1) return `H1: ${h1.textContent}`;
            if (h2) return `H2: ${h2.textContent}`;
            if (h3) return `H3: ${h3.textContent}`;
            
            return 'No heading found';
        });
        console.log(`🎯 Debug content: ${debugContent}`);
        
        // Look for environment variables
        const envInfo = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasVite: text.includes('VITE_'),
                hasSupabase: text.includes('SUPABASE'),
                hasEnvironment: text.includes('Environment'),
                sample: text.substring(0, 200)
            };
        });
        console.log('🔑 Environment info:', JSON.stringify(envInfo, null, 2));
        
        // Check console errors
        const logs = [];
        page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
        
        // Wait a bit more for any console messages
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (logs.length > 0) {
            console.log('📋 Console messages:');
            logs.forEach(log => console.log(`  ${log}`));
        } else {
            console.log('📋 No console messages captured');
        }
        
        // Get full body content preview
        console.log('\n📖 Body content preview:');
        console.log(bodyText.substring(0, 500) + (bodyText.length > 500 ? '...' : ''));
        
        console.log('\n✅ Check completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

checkFitForge();