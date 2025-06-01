// Navigation Flow Debugging Script
// Test FitForge workout navigation flow

const SERVER_URL = 'http://localhost:5000';

async function testNavigationFlow() {
    console.log('🧪 Testing FitForge Navigation Flow...');
    
    // Test 1: Homepage loads
    console.log('\n1️⃣ Testing homepage...');
    try {
        const response = await fetch(SERVER_URL);
        console.log(`✅ Homepage: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`❌ Homepage failed: ${error.message}`);
        return;
    }
    
    // Test 2: Workouts page loads  
    console.log('\n2️⃣ Testing /workouts page...');
    try {
        const response = await fetch(`${SERVER_URL}/workouts`);
        console.log(`✅ Workouts page: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`❌ Workouts page failed: ${error.message}`);
    }
    
    // Test 3: Start workout page loads
    console.log('\n3️⃣ Testing /start-workout page...');
    try {
        const response = await fetch(`${SERVER_URL}/start-workout?type=abs`);
        console.log(`✅ Start workout page: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`❌ Start workout page failed: ${error.message}`);
    }
    
    // Test 4: Workout session page loads
    console.log('\n4️⃣ Testing /workout-session page...');
    try {
        const response = await fetch(`${SERVER_URL}/workout-session`);
        console.log(`✅ Workout session page: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.log(`❌ Workout session page failed: ${error.message}`);
    }
    
    // Test 5: API endpoints
    console.log('\n5️⃣ Testing API endpoints...');
    try {
        const response = await fetch(`${SERVER_URL}/api/exercises`);
        const data = await response.json();
        console.log(`✅ API exercises: ${response.status}, ${data.length} exercises loaded`);
    } catch (error) {
        console.log(`❌ API exercises failed: ${error.message}`);
    }
    
    console.log('\n🎯 Navigation flow test complete!');
}

testNavigationFlow();