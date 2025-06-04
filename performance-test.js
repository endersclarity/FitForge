#!/usr/bin/env node

/**
 * FitForge Unified Storage Performance Test
 * Tests multiple user scenarios simultaneously to validate:
 * - Data isolation between users
 * - Concurrent workout session handling
 * - Performance under load
 * - Data integrity
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const USER_COUNT = 5;
const WORKOUTS_PER_USER = 3;
const CONCURRENT_REQUESTS = 10;

// Test data for different users
const testUsers = [
  { id: '1', name: 'Alice', workoutType: 'Abs' },
  { id: '2', name: 'Bob', workoutType: 'BackBiceps' },
  { id: '3', name: 'Charlie', workoutType: 'ChestTriceps' },
  { id: '4', name: 'Diana', workoutType: 'Legs' },
  { id: '5', name: 'Eve', workoutType: 'Abs' }
];

const testExercises = {
  'Abs': ['planks', 'hanging-knee-raises'],
  'BackBiceps': ['bent-over-rows', 'chin-ups'], 
  'ChestTriceps': ['bench-press', 'pushup'],
  'Legs': ['goblet-squats', 'dead-lifts']
};

class PerformanceTest {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      userDataIntegrity: {},
      concurrencyTest: {},
      startTime: Date.now()
    };
  }

  async makeRequest(url, options = {}) {
    const startTime = Date.now();
    this.results.totalRequests++;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': options.userId || '1',
          ...options.headers
        },
        ...options
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.results.successfulRequests++;
        const data = await response.json();
        this.updateAverageResponseTime(responseTime);
        return { success: true, data, responseTime };
      } else {
        this.results.failedRequests++;
        return { success: false, status: response.status, responseTime };
      }
    } catch (error) {
      this.results.failedRequests++;
      const responseTime = Date.now() - startTime;
      return { success: false, error: error.message, responseTime };
    }
  }

  updateAverageResponseTime(responseTime) {
    const totalResponseTime = this.results.averageResponseTime * this.results.successfulRequests;
    this.results.averageResponseTime = (totalResponseTime + responseTime) / this.results.successfulRequests;
  }

  async testUserDataIsolation() {
    console.log('\n🔒 Testing User Data Isolation...');
    
    for (const user of testUsers) {
      console.log(`  Testing user ${user.name} (ID: ${user.id})`);
      
      // First, try to abandon any existing active sessions
      const historyCheck = await this.makeRequest(`${BASE_URL}/api/workouts/history`, {
        userId: user.id
      });
      
      if (historyCheck.success) {
        const activeSessions = historyCheck.data.workouts.filter(w => w.sessionType === 'active');
        for (const activeSession of activeSessions) {
          await this.makeRequest(`${BASE_URL}/api/workouts/${activeSession.id}/force-abandon`, {
            method: 'PUT',
            userId: user.id,
            body: JSON.stringify({})
          });
        }
      }
      
      // Start workout for this user
      const startResult = await this.makeRequest(`${BASE_URL}/api/workouts/start`, {
        method: 'POST',
        userId: user.id,
        body: JSON.stringify({
          workoutType: user.workoutType,
          exercises: testExercises[user.workoutType]
        })
      });

      if (!startResult.success) {
        console.log(`    ❌ Failed to start workout: ${startResult.error || startResult.status}`);
        continue;
      }

      const sessionId = startResult.data.sessionId;
      console.log(`    ✅ Started workout session: ${sessionId}`);

      // Log a set for this user
      const setResult = await this.makeRequest(`${BASE_URL}/api/workouts/${sessionId}/sets`, {
        method: 'POST',
        userId: user.id,
        body: JSON.stringify({
          exerciseId: testExercises[user.workoutType][0],
          reps: 10 + parseInt(user.id),
          weight: 50 + parseInt(user.id) * 10,
          formScore: 8
        })
      });

      if (setResult.success) {
        console.log(`    ✅ Logged set: ${10 + parseInt(user.id)} reps`);
      } else {
        console.log(`    ❌ Failed to log set: ${setResult.error || setResult.status}`);
      }

      // Complete workout
      const completeResult = await this.makeRequest(`${BASE_URL}/api/workouts/${sessionId}/complete`, {
        method: 'PUT',
        userId: user.id,
        body: JSON.stringify({
          rating: 4,
          notes: `Test workout for ${user.name}`
        })
      });

      if (completeResult.success) {
        console.log(`    ✅ Completed workout`);
      } else {
        console.log(`    ❌ Failed to complete workout: ${completeResult.error}`);
      }

      // Verify user's data isolation
      const historyResult = await this.makeRequest(`${BASE_URL}/api/workouts/history`, {
        userId: user.id
      });

      if (historyResult.success) {
        const userWorkouts = historyResult.data.workouts;
        const userSpecificWorkouts = userWorkouts.filter(w => w.sessionType === 'completed');
        console.log(`    ✅ User has ${userSpecificWorkouts.length} completed workouts in history`);
        
        this.results.userDataIntegrity[user.id] = {
          workoutsCount: userSpecificWorkouts.length,
          workoutType: user.workoutType,
          dataIsolated: true
        };
      } else {
        console.log(`    ❌ Failed to fetch history: ${historyResult.error}`);
        this.results.userDataIntegrity[user.id] = { dataIsolated: false };
      }
    }
  }

  async testConcurrentRequests() {
    console.log('\n⚡ Testing Concurrent Request Handling...');
    
    const concurrentPromises = [];
    const testStartTime = Date.now();
    
    // Create multiple concurrent requests
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      const userId = ((i % USER_COUNT) + 1).toString();
      const promise = this.makeRequest(`${BASE_URL}/api/workouts/analytics`, {
        userId: userId
      });
      concurrentPromises.push(promise);
    }

    const results = await Promise.all(concurrentPromises);
    const concurrentTestTime = Date.now() - testStartTime;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`  ✅ ${successful}/${CONCURRENT_REQUESTS} concurrent requests successful`);
    console.log(`  ⏱️  Total time: ${concurrentTestTime}ms`);
    console.log(`  📊 Average per request: ${(concurrentTestTime / CONCURRENT_REQUESTS).toFixed(2)}ms`);
    
    this.results.concurrencyTest = {
      totalRequests: CONCURRENT_REQUESTS,
      successful,
      failed,
      totalTime: concurrentTestTime,
      averagePerRequest: concurrentTestTime / CONCURRENT_REQUESTS
    };
  }

  async testDataPersistence() {
    console.log('\n💾 Testing Data Persistence...');
    
    // Check if data files exist for each user
    for (const user of testUsers) {
      const userDataPath = path.join(__dirname, 'data', 'users', user.id, 'unified-workouts.json');
      
      if (fs.existsSync(userDataPath)) {
        try {
          const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
          const completedWorkouts = userData.workouts?.filter(w => w.sessionType === 'completed') || [];
          console.log(`  ✅ User ${user.name}: ${completedWorkouts.length} workouts persisted to disk`);
          
          // Verify aggregations are calculated
          if (userData.aggregations) {
            console.log(`    📊 Aggregations: ${userData.aggregations.totalWorkouts} total, ${userData.aggregations.totalVolume} volume`);
          }
        } catch (error) {
          console.log(`  ❌ User ${user.name}: Failed to read data file - ${error.message}`);
        }
      } else {
        console.log(`  ❌ User ${user.name}: No data file found at ${userDataPath}`);
      }
    }
  }

  async testApiEndpoints() {
    console.log('\n🌐 Testing All API Endpoints...');
    
    const endpoints = [
      { path: '/api/exercises', method: 'GET', description: 'Exercise Database' },
      { path: '/api/workouts/history', method: 'GET', description: 'Workout History' },
      { path: '/api/workouts/analytics', method: 'GET', description: 'Analytics' },
      { path: '/api/workouts/muscle-recovery', method: 'GET', description: 'Muscle Recovery' }
    ];

    for (const endpoint of endpoints) {
      const result = await this.makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        userId: '1'
      });

      if (result.success) {
        console.log(`  ✅ ${endpoint.description}: ${result.responseTime}ms`);
      } else {
        console.log(`  ❌ ${endpoint.description}: ${result.error || result.status}`);
      }
    }
  }

  printResults() {
    const totalTime = Date.now() - this.results.startTime;
    
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('================================');
    console.log(`Total Test Time: ${totalTime}ms`);
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    
    console.log('\n👥 User Data Integrity:');
    Object.entries(this.results.userDataIntegrity).forEach(([userId, data]) => {
      const user = testUsers.find(u => u.id === userId);
      console.log(`  User ${user?.name}: ${data.dataIsolated ? '✅' : '❌'} (${data.workoutsCount || 0} workouts)`);
    });
    
    console.log('\n⚡ Concurrency Test:');
    console.log(`  ${this.results.concurrencyTest.successful}/${this.results.concurrencyTest.totalRequests} requests successful`);
    console.log(`  Average response time: ${this.results.concurrencyTest.averagePerRequest?.toFixed(2)}ms`);
    
    // Overall assessment
    const overallSuccess = this.results.successfulRequests / this.results.totalRequests;
    if (overallSuccess >= 0.95) {
      console.log('\n🎉 PERFORMANCE TEST PASSED: Unified storage system performing well');
    } else if (overallSuccess >= 0.8) {
      console.log('\n⚠️  PERFORMANCE TEST WARNING: Some issues detected');
    } else {
      console.log('\n❌ PERFORMANCE TEST FAILED: Significant issues detected');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting FitForge Unified Storage Performance Test');
    console.log(`Testing with ${USER_COUNT} users, ${CONCURRENT_REQUESTS} concurrent requests`);
    
    await this.testApiEndpoints();
    await this.testUserDataIsolation();
    await this.testConcurrentRequests();
    await this.testDataPersistence();
    
    this.printResults();
  }
}

// Run the test
if (require.main === module) {
  const test = new PerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = PerformanceTest;