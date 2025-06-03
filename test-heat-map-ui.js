// Browser console testing script for muscle heat map
// Run this in the browser console on the dashboard page

console.log('🔥 Testing Muscle Heat Map UI');

// Test 1: Check if muscle recovery hook is working
function testMuscleRecoveryHook() {
  console.log('\n=== Testing Muscle Recovery Hook ===');
  
  // Check if the hook data is available in React DevTools
  const dashboardElement = document.querySelector('[data-testid="muscle-heat-map"]') || 
                          document.querySelector('.muscle-heat-map') ||
                          document.querySelector('[class*="muscle"]');
  
  if (dashboardElement) {
    console.log('✅ Found muscle heat map element');
    console.log('Element:', dashboardElement);
  } else {
    console.log('❌ No muscle heat map element found');
    console.log('Available elements:', document.querySelectorAll('[class*="muscle"], [class*="heat"], [class*="recovery"]'));
  }
}

// Test 2: Check SVG body diagram
function testBodyDiagram() {
  console.log('\n=== Testing Body Diagram SVG ===');
  
  const svgElements = document.querySelectorAll('svg');
  console.log(`Found ${svgElements.length} SVG elements`);
  
  svgElements.forEach((svg, index) => {
    const muscleGroups = svg.querySelectorAll('[data-muscle], [id*="muscle"], [class*="muscle"]');
    if (muscleGroups.length > 0) {
      console.log(`✅ SVG ${index + 1} has ${muscleGroups.length} muscle group elements`);
      console.log('Muscle groups:', Array.from(muscleGroups).map(el => el.id || el.dataset.muscle || el.className));
    }
  });
}

// Test 3: Check color coding
function testColorCoding() {
  console.log('\n=== Testing Color Coding ===');
  
  const coloredElements = document.querySelectorAll('[style*="fill"], [style*="color"], [class*="bg-"]');
  console.log(`Found ${coloredElements.length} colored elements`);
  
  // Check for heat map colors
  const heatMapColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']; // Red, Orange, Yellow, Green, Blue
  let foundColors = [];
  
  coloredElements.forEach(el => {
    const style = el.style.fill || el.style.color || el.style.backgroundColor;
    if (style && heatMapColors.some(color => style.includes(color))) {
      foundColors.push(style);
    }
  });
  
  console.log('Heat map colors found:', [...new Set(foundColors)]);
}

// Test 4: Check muscle group interactions
function testInteractions() {
  console.log('\n=== Testing Muscle Group Interactions ===');
  
  const clickableElements = document.querySelectorAll('[data-muscle], [onclick], button, [role="button"]');
  console.log(`Found ${clickableElements.length} potentially clickable elements`);
  
  // Test hover events
  const hoverElements = document.querySelectorAll('[onmouseover], [onmouseenter], [title]');
  console.log(`Found ${hoverElements.length} elements with hover events or tooltips`);
}

// Test 5: Check for tooltip content
function testTooltips() {
  console.log('\n=== Testing Tooltips ===');
  
  // Look for tooltip containers or content
  const tooltipElements = document.querySelectorAll('[role="tooltip"], .tooltip, [data-tooltip], [aria-describedby]');
  console.log(`Found ${tooltipElements.length} tooltip-related elements`);
  
  // Check for tooltip trigger elements
  const triggerElements = document.querySelectorAll('[aria-describedby], [data-tooltip-target]');
  console.log(`Found ${triggerElements.length} tooltip trigger elements`);
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running all muscle heat map tests...');
  testMuscleRecoveryHook();
  testBodyDiagram();
  testColorCoding();
  testInteractions();
  testTooltips();
  console.log('\n✅ Testing complete! Check the logs above for results.');
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.muscleHeatMapTests = {
  testMuscleRecoveryHook,
  testBodyDiagram,
  testColorCoding,
  testInteractions,
  testTooltips,
  runAllTests
};