#!/usr/bin/env node

/**
 * Performance Test Suite for Unified Storage System
 * 
 * Tests the unified storage system with:
 * - Multiple concurrent users
 * - Realistic workout data loads
 * - Data isolation between users
 * - System performance metrics
 * - Concurrency handling
 * - Data integrity validation
 */

const { UnifiedFileStorage } = require('./server/unifiedFileStorage');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  USER_COUNT: 10,
  WORKOUTS_PER_USER: 20,
  EXERCISES_PER_WORKOUT: 5,
  SETS_PER_EXERCISE: 3,
  CONCURRENT_OPERATIONS: 25,
  TEST_DATA_DIR: './data/performance-test',
  CLEANUP_AFTER_TEST: true
};

// Exercise database for realistic testing
const EXERCISES = [
  { id: 1, name: 'Bench Press', muscles: ['chest', 'triceps', 'shoulders'] },
  { id: 2, name: 'Squats', muscles: ['quadriceps', 'glutes'] },
  { id: 3, name: 'Deadlift', muscles: ['back', 'hamstrings', 'glutes'] },
  { id: 4, name: 'Pull Ups', muscles: ['back', 'biceps'] },
  { id: 5, name: 'Overhead Press', muscles: ['shoulders', 'triceps'] },
  { id: 6, name: 'Bent Over Row', muscles: ['back', 'biceps'] },
  { id: 7, name: 'Dips', muscles: ['chest', 'triceps'] },
  { id: 8, name: 'Leg Press', muscles: ['quadriceps', 'glutes'] },
  { id: 9, name: 'Bicep Curls', muscles: ['biceps'] },
  { id: 10, name: 'Tricep Extension', muscles: ['triceps'] },
  { id: 11, name: 'Leg Curls', muscles: ['hamstrings'] },
  { id: 12, name: 'Lateral Raises', muscles: ['shoulders'] },
  { id: 13, name: 'Calf Raises', muscles: ['calves'] },
  { id: 14, name: 'Planks', muscles: ['abs'] },
  { id: 15, name: 'Lunges', muscles: ['quadriceps', 'glutes'] }
];

const WORKOUT_TYPES = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Full Body', 'Abs', 'Push', 'Pull'];

class PerformanceTestSuite {
  constructor() {
    this.storage = new UnifiedFileStorage(TEST_CONFIG.TEST_DATA_DIR);
    this.testResults = {
      totalUsers: 0,
      totalWorkouts: 0,
      totalExercises: 0,
      totalSets: 0,
      operationTimes: [],
      errors: [],
      dataIntegrityChecks: [],
      concurrencyResults: [],
      memoryUsage: []
    };
    this.testStartTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing Performance Test Suite for Unified Storage');
    console.log(`📊 Test Configuration:
    - Users: ${TEST_CONFIG.USER_COUNT}
    - Workouts per user: ${TEST_CONFIG.WORKOUTS_PER_USER}
    - Exercises per workout: ${TEST_CONFIG.EXERCISES_PER_WORKOUT}
    - Sets per exercise: ${TEST_CONFIG.SETS_PER_EXERCISE}
    - Total operations: ~${TEST_CONFIG.USER_COUNT * TEST_CONFIG.WORKOUTS_PER_USER * TEST_CONFIG.EXERCISES_PER_WORKOUT * TEST_CONFIG.SETS_PER_EXERCISE}
    `);

    // Clean up previous test data
    if (await fs.pathExists(TEST_CONFIG.TEST_DATA_DIR)) {
      await fs.remove(TEST_CONFIG.TEST_DATA_DIR);
    }

    await this.storage.initialize();
    console.log('✅ Storage initialized\n');
  }

  generateRealisticSetData() {
    return {
      setNumber: Math.floor(Math.random() * 5) + 1,
      weight: Math.floor(Math.random() * 200) + 20, // 20-220 lbs
      reps: Math.floor(Math.random() * 12) + 3,     // 3-15 reps
      formScore: Math.floor(Math.random() * 3) + 8,  // 8-10
      rpe: Math.floor(Math.random() * 4) + 6,        // 6-10
      equipment: ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'][Math.floor(Math.random() * 5)],
      isWarmup: Math.random() < 0.15,
      isDropSet: Math.random() < 0.1,
      isFailure: Math.random() < 0.05
    };
  }

  async createRealisticWorkout(userId, workoutIndex) {
    const startTime = Date.now();
    
    try {
      const workoutType = WORKOUT_TYPES[Math.floor(Math.random() * WORKOUT_TYPES.length)];
      const selectedExercises = this.selectExercisesForWorkout(TEST_CONFIG.EXERCISES_PER_WORKOUT);
      
      // Create workout session
      const session = await this.storage.createUnifiedWorkoutSession(
        userId,
        workoutType,
        selectedExercises.map(e => e.name.toLowerCase().replace(/\s+/g, '-'))
      );

      // Log exercises and sets
      for (const exercise of selectedExercises) {
        for (let setNum = 1; setNum <= TEST_CONFIG.SETS_PER_EXERCISE; setNum++) {
          const setData = this.generateRealisticSetData();
          setData.setNumber = setNum;
          
          await this.storage.logSetToUnifiedStorage(
            userId,
            session.id,
            exercise.id,
            exercise.name,
            setData
          );
        }
      }

      // Complete workout
      const rating = Math.floor(Math.random() * 5) + 1;
      const notes = this.generateWorkoutNotes();
      
      const completion = await this.storage.completeUnifiedWorkoutSession(
        userId,
        session.id,
        rating,
        notes
      );

      const operationTime = Date.now() - startTime;
      this.testResults.operationTimes.push(operationTime);
      this.testResults.totalWorkouts++;
      this.testResults.totalExercises += selectedExercises.length;
      this.testResults.totalSets += selectedExercises.length * TEST_CONFIG.SETS_PER_EXERCISE;

      return {
        userId,
        workoutIndex,
        sessionId: session.id,
        operationTime,
        completion
      };

    } catch (error) {
      this.testResults.errors.push({
        userId,
        workoutIndex,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`❌ Error creating workout for user ${userId}, workout ${workoutIndex}:`, error.message);
      return null;
    }
  }

  selectExercisesForWorkout(count) {
    const shuffled = [...EXERCISES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generateWorkoutNotes() {
    const notes = [
      "Great workout, felt strong today!",
      "Struggled with the last few reps but pushed through",
      "Need to focus on form next time",
      "Increased weight from last session",
      "Felt tired but completed all sets",
      "Perfect form throughout the workout",
      "New personal record on this exercise!",
      "Good pump, muscles feeling worked",
      "",
      "Quick session but effective"
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  async testSingleUserPerformance() {
    console.log('🏃‍♂️ Testing Single User Performance...');
    const userId = 'perf-user-1';
    const startTime = Date.now();

    for (let i = 0; i < TEST_CONFIG.WORKOUTS_PER_USER; i++) {
      await this.createRealisticWorkout(userId, i);
      if (i % 5 === 0) {
        process.stdout.write(`\r   Workout ${i + 1}/${TEST_CONFIG.WORKOUTS_PER_USER} completed`);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Single user test completed in ${totalTime}ms`);
    console.log(`   Average time per workout: ${Math.round(totalTime / TEST_CONFIG.WORKOUTS_PER_USER)}ms\n`);

    return { userId, totalTime, workoutCount: TEST_CONFIG.WORKOUTS_PER_USER };
  }

  async testConcurrentUsers() {
    console.log('👥 Testing Concurrent Users Performance...');
    const startTime = Date.now();

    // Create users concurrently
    const userPromises = [];
    for (let userId = 1; userId <= TEST_CONFIG.USER_COUNT; userId++) {
      const userIdStr = `perf-user-${userId}`;
      
      // Create fewer workouts per user for concurrent test
      const workoutsPerUser = Math.floor(TEST_CONFIG.WORKOUTS_PER_USER / 2);
      const userWorkouts = [];
      
      for (let workoutIndex = 0; workoutIndex < workoutsPerUser; workoutIndex++) {
        userWorkouts.push(this.createRealisticWorkout(userIdStr, workoutIndex));
      }
      
      userPromises.push(Promise.all(userWorkouts));
    }

    const results = await Promise.all(userPromises);
    const totalTime = Date.now() - startTime;

    console.log(`✅ Concurrent users test completed in ${totalTime}ms`);
    console.log(`   ${TEST_CONFIG.USER_COUNT} users processed concurrently\n`);

    this.testResults.concurrencyResults = results;
    return { totalTime, userCount: TEST_CONFIG.USER_COUNT };
  }

  async testDataIsolation() {
    console.log('🔒 Testing Data Isolation Between Users...');
    
    const user1Id = 'isolation-user-1';
    const user2Id = 'isolation-user-2';
    const user3Id = 'isolation-user-3';

    // Create different workouts for each user
    const workout1 = await this.createRealisticWorkout(user1Id, 1);
    const workout2 = await this.createRealisticWorkout(user2Id, 1);
    const workout3 = await this.createRealisticWorkout(user3Id, 1);

    // Verify data isolation
    const user1Data = await this.storage.getUserWorkoutData(user1Id);
    const user2Data = await this.storage.getUserWorkoutData(user2Id);
    const user3Data = await this.storage.getUserWorkoutData(user3Id);

    const isolationResults = {
      user1Sessions: user1Data.sessions.length,
      user2Sessions: user2Data.sessions.length,
      user3Sessions: user3Data.sessions.length,
      crossContamination: false
    };

    // Check for cross-contamination
    const user1SessionIds = new Set(user1Data.sessions.map(s => s.id));
    const user2SessionIds = new Set(user2Data.sessions.map(s => s.id));
    const user3SessionIds = new Set(user3Data.sessions.map(s => s.id));

    // Check if any sessions appear in multiple users' data
    user1Data.sessions.forEach(session => {
      if (session.userId !== user1Id) {
        isolationResults.crossContamination = true;
      }
    });

    user2Data.sessions.forEach(session => {
      if (session.userId !== user2Id) {
        isolationResults.crossContamination = true;
      }
    });

    user3Data.sessions.forEach(session => {
      if (session.userId !== user3Id) {
        isolationResults.crossContamination = true;
      }
    });

    this.testResults.dataIntegrityChecks.push(isolationResults);

    if (isolationResults.crossContamination) {
      console.log('❌ Data isolation FAILED - cross-contamination detected');
    } else {
      console.log('✅ Data isolation PASSED - no cross-contamination detected');
    }

    console.log(`   User 1: ${isolationResults.user1Sessions} sessions`);
    console.log(`   User 2: ${isolationResults.user2Sessions} sessions`);
    console.log(`   User 3: ${isolationResults.user3Sessions} sessions\n`);

    return isolationResults;
  }

  async testDataIntegrity() {
    console.log('🔍 Testing Data Integrity and Consistency...');
    
    const userId = 'integrity-user-1';
    const testWorkout = await this.createRealisticWorkout(userId, 1);
    
    if (!testWorkout) {
      console.log('❌ Data integrity test failed - could not create test workout');
      return false;
    }

    // Retrieve the data and validate
    const userData = await this.storage.getUserWorkoutData(userId);
    const session = userData.sessions.find(s => s.id === testWorkout.sessionId);

    const integrityChecks = {
      sessionExists: !!session,
      sessionCompleted: session?.sessionType === 'completed',
      correctUserId: session?.userId === userId,
      exercisesPresent: session?.exercises?.length > 0,
      setsPresent: session?.exercises?.every(e => e.sets.length > 0),
      volumeCalculation: true,
      aggregationsUpdated: userData.aggregations.totalWorkouts > 0
    };

    // Validate volume calculations
    if (session) {
      const calculatedVolume = session.exercises.reduce((total, exercise) => {
        return total + exercise.sets.reduce((exerciseTotal, set) => {
          return exerciseTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
      
      integrityChecks.volumeCalculation = Math.abs(calculatedVolume - session.totalVolume) < 0.01;
    }

    const allPassed = Object.values(integrityChecks).every(check => check === true);

    if (allPassed) {
      console.log('✅ Data integrity PASSED - all checks successful');
    } else {
      console.log('❌ Data integrity FAILED:');
      Object.entries(integrityChecks).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`   - ${check}: FAILED`);
        }
      });
    }

    this.testResults.dataIntegrityChecks.push(integrityChecks);
    return integrityChecks;
  }

  async testLargeDataLoad() {
    console.log('📊 Testing Large Data Load Performance...');
    
    const userId = 'large-data-user';
    const largeWorkoutCount = 50; // Larger than normal
    const startTime = Date.now();

    for (let i = 0; i < largeWorkoutCount; i++) {
      await this.createRealisticWorkout(userId, i);
      if (i % 10 === 0) {
        const memUsage = process.memoryUsage();
        this.testResults.memoryUsage.push({
          workout: i,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        });
        process.stdout.write(`\r   Large data test: ${i}/${largeWorkoutCount} workouts`);
      }
    }

    const totalTime = Date.now() - startTime;
    const userData = await this.storage.getUserWorkoutData(userId);

    console.log(`\n✅ Large data load test completed in ${totalTime}ms`);
    console.log(`   Created ${userData.sessions.length} sessions`);
    console.log(`   Total volume: ${userData.aggregations.totalVolume}`);
    console.log(`   File size: ${await this.getFileSize(userId)}\n`);

    return {
      workoutCount: userData.sessions.length,
      totalTime,
      averageTimePerWorkout: totalTime / largeWorkoutCount,
      finalFileSize: await this.getFileSize(userId)
    };
  }

  async getFileSize(userId) {
    try {
      const filePath = path.join(TEST_CONFIG.TEST_DATA_DIR, 'users', userId, 'unified-workouts.json');
      const stats = await fs.stat(filePath);
      return Math.round(stats.size / 1024 * 100) / 100; // KB with 2 decimal places
    } catch {
      return 0;
    }
  }

  async generatePerformanceReport() {
    console.log('📋 Generating Performance Report...\n');

    const totalTestTime = Date.now() - this.testStartTime;
    const avgOperationTime = this.testResults.operationTimes.length > 0 
      ? this.testResults.operationTimes.reduce((a, b) => a + b, 0) / this.testResults.operationTimes.length 
      : 0;

    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: TEST_CONFIG,
      summary: {
        totalTestTime,
        totalUsers: TEST_CONFIG.USER_COUNT + 6, // Including special test users
        totalWorkouts: this.testResults.totalWorkouts,
        totalExercises: this.testResults.totalExercises,
        totalSets: this.testResults.totalSets,
        averageOperationTime: Math.round(avgOperationTime),
        errorCount: this.testResults.errors.length,
        successRate: ((this.testResults.totalWorkouts - this.testResults.errors.length) / Math.max(1, this.testResults.totalWorkouts)) * 100
      },
      performance: {
        operationTimes: {
          min: Math.min(...this.testResults.operationTimes),
          max: Math.max(...this.testResults.operationTimes),
          average: avgOperationTime,
          median: this.calculateMedian(this.testResults.operationTimes)
        },
        memoryUsage: this.testResults.memoryUsage
      },
      dataIntegrity: {
        isolationTests: this.testResults.dataIntegrityChecks.filter(c => c.hasOwnProperty('crossContamination')),
        integrityTests: this.testResults.dataIntegrityChecks.filter(c => c.hasOwnProperty('sessionExists'))
      },
      errors: this.testResults.errors,
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(TEST_CONFIG.TEST_DATA_DIR, 'performance-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });

    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`⏱️  Total Test Time: ${Math.round(totalTestTime / 1000)}s`);
    console.log(`👥 Users Tested: ${report.summary.totalUsers}`);
    console.log(`🏋️  Workouts Created: ${report.summary.totalWorkouts}`);
    console.log(`💪 Exercises Logged: ${report.summary.totalExercises}`);
    console.log(`🔢 Sets Recorded: ${report.summary.totalSets}`);
    console.log(`⚡ Average Operation Time: ${report.summary.averageOperationTime}ms`);
    console.log(`✅ Success Rate: ${report.summary.successRate.toFixed(2)}%`);
    console.log(`❌ Errors: ${report.summary.errorCount}`);
    
    if (this.testResults.memoryUsage.length > 0) {
      const maxMemory = Math.max(...this.testResults.memoryUsage.map(m => m.heapUsed));
      console.log(`🧠 Peak Memory Usage: ${Math.round(maxMemory / 1024 / 1024)}MB`);
    }

    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  }

  calculateMedian(numbers) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  generateRecommendations() {
    const recommendations = [];
    const avgTime = this.testResults.operationTimes.length > 0 
      ? this.testResults.operationTimes.reduce((a, b) => a + b, 0) / this.testResults.operationTimes.length 
      : 0;

    if (avgTime > 500) {
      recommendations.push('Operation times are high (>500ms). Consider optimizing file I/O operations.');
    }

    if (this.testResults.errors.length > 0) {
      recommendations.push(`${this.testResults.errors.length} errors occurred. Review error handling and data validation.`);
    }

    const hasDataIntegrityIssues = this.testResults.dataIntegrityChecks.some(check => 
      Object.values(check).some(value => value === false)
    );

    if (hasDataIntegrityIssues) {
      recommendations.push('Data integrity issues detected. Review storage implementation and validation logic.');
    }

    if (this.testResults.memoryUsage.length > 0) {
      const memoryGrowth = this.testResults.memoryUsage[this.testResults.memoryUsage.length - 1].heapUsed 
        - this.testResults.memoryUsage[0].heapUsed;
      
      if (memoryGrowth > 50 * 1024 * 1024) { // 50MB growth
        recommendations.push('Significant memory growth detected. Check for memory leaks in storage operations.');
      }
    }

    if (avgTime < 200 && this.testResults.errors.length === 0) {
      recommendations.push('Excellent performance! System handles load well with fast operations and no errors.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable ranges. No major issues detected.');
    }

    return recommendations;
  }

  async cleanup() {
    if (TEST_CONFIG.CLEANUP_AFTER_TEST) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await fs.remove(TEST_CONFIG.TEST_DATA_DIR);
        console.log('✅ Test data cleaned up successfully');
      } catch (error) {
        console.log('⚠️  Warning: Could not clean up test data:', error.message);
      }
    } else {
      console.log(`\n📁 Test data preserved at: ${TEST_CONFIG.TEST_DATA_DIR}`);
    }
  }

  async runAllTests() {
    try {
      await this.initialize();

      // Test 1: Single user performance
      await this.testSingleUserPerformance();

      // Test 2: Data isolation
      await this.testDataIsolation();

      // Test 3: Data integrity
      await this.testDataIntegrity();

      // Test 4: Large data load
      await this.testLargeDataLoad();

      // Test 5: Concurrent users (run last as it's most intensive)
      await this.testConcurrentUsers();

      // Generate final report
      const report = await this.generatePerformanceReport();

      return report;

    } catch (error) {
      console.error('💥 Performance test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for programmatic use
module.exports = { PerformanceTestSuite, TEST_CONFIG };

// Run if called directly
if (require.main === module) {
  const testSuite = new PerformanceTestSuite();
  
  testSuite.runAllTests()
    .then(report => {
      console.log('\n🎉 Performance test suite completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Performance test suite failed:', error);
      process.exit(1);
    });
}