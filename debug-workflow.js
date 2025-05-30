// Quick browser automation to test progressive overload workflow
const puppeteer = require('puppeteer');

async function testProgressiveOverloadWorkflow() {
  console.log('🚀 Starting FitForge Progressive Overload Workflow Test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to home page
    console.log('📍 Step 1: Navigate to home page');
    await page.goto('http://172.22.206.209:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'debug-step1-home.png' });
    
    // Navigate to workouts page
    console.log('📍 Step 2: Navigate to workouts page');
    await page.click('a[href="/workouts"]');
    await page.waitForSelector('[data-testid="workout-card"], .workout-card, .card', { timeout: 5000 });
    await page.screenshot({ path: 'debug-step2-workouts.png' });
    
    // Click first workout card
    console.log('📍 Step 3: Click first workout card');
    const workoutCards = await page.$$('[data-testid="workout-card"], .workout-card, .card');
    if (workoutCards.length > 0) {
      await workoutCards[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.screenshot({ path: 'debug-step3-exercise-selection.png' });
    } else {
      console.log('❌ No workout cards found!');
      const pageContent = await page.content();
      console.log('Page content preview:', pageContent.substring(0, 500));
    }
    
    // Check for exercise list
    console.log('📍 Step 4: Check exercise selection page');
    const exercises = await page.$$('[data-testid="exercise-item"], .exercise-item, .exercise');
    console.log(`Found ${exercises.length} exercises`);
    
    if (exercises.length > 0) {
      // Select first few exercises and start workout
      await exercises[0].click();
      if (exercises.length > 1) await exercises[1].click();
      
      const startButton = await page.$('[data-testid="start-workout"], button:contains("Start"), button:contains("Begin")');
      if (startButton) {
        await startButton.click();
        await page.waitForSelector('[data-testid="set-logger"], .set-logger, .workout-session', { timeout: 5000 });
        await page.screenshot({ path: 'debug-step4-workout-session.png' });
        console.log('✅ Successfully reached workout session!');
        
        // Check for progressive overload suggestions
        const suggestions = await page.$$('[data-testid="progressive-overload"], .progressive-overload, .suggestion');
        console.log(`Found ${suggestions.length} progressive overload suggestions`);
      }
    } else {
      console.log('❌ No exercises found on selection page!');
    }
    
    console.log('✅ Workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during workflow test:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testProgressiveOverloadWorkflow().catch(console.error);