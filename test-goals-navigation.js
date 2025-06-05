#!/usr/bin/env node
/**
 * Quick navigation test for Goals page
 * Tests that the Goals page loads without Navigation Error
 */

const puppeteer = require('puppeteer');

const WSL_IP = '172.22.206.209';
const PORT = 5000;
const BASE_URL = `http://${WSL_IP}:${PORT}`;

async function testGoalsPageNavigation() {
  let browser;
  try {
    console.log('🚀 Starting Goals page navigation test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to home page first
    console.log('📍 Navigating to home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`✅ Home page loaded: ${title}`);
    
    // Navigate to Goals page directly
    console.log('🎯 Navigating to Goals page...');
    await page.goto(`${BASE_URL}/goals`, { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check for navigation error
    const errorText = await page.evaluate(() => {
      const errorElement = document.querySelector('*');
      return errorElement ? errorElement.textContent : '';
    });
    
    if (errorText.includes('Navigation Error') || errorText.includes('Something went wrong with the navigation system')) {
      console.log('❌ FAILED: Goals page shows navigation error');
      console.log('Error content:', errorText.substring(0, 200));
      return false;
    }
    
    // Check for Goals page content
    const goalsContent = await page.evaluate(() => {
      const body = document.body.textContent;
      return body.includes('Fitness Goals') || body.includes('Goals') || body.includes('Target');
    });
    
    if (goalsContent) {
      console.log('✅ SUCCESS: Goals page loaded without navigation error');
      return true;
    } else {
      console.log('⚠️ WARNING: Goals page loaded but content not found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testGoalsPageNavigation().then(success => {
  if (success) {
    console.log('🎉 Goals navigation test PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Goals navigation test FAILED!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});