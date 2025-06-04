#!/usr/bin/env tsx

/**
 * TypeScript Performance Test Suite for Unified Storage System
 * 
 * Tests the unified storage system with multiple users and realistic data loads.
 */

import { UnifiedFileStorage } from './server/unifiedFileStorage';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';

// Test configuration
const TEST_CONFIG = {
  USER_COUNT: 5,
  WORKOUTS_PER_USER: 10,
  EXERCISES_PER_WORKOUT: 3,
  SETS_PER_EXERCISE: 3,
  TEST_DATA_DIR: './data/performance-test-ts',
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
  { id: 10, name: 'Tricep Extension', muscles: ['triceps'] }
];

const WORKOUT_TYPES = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Full Body', 'Push', 'Pull'];

interface TestResults {
  totalUsers: number;
  totalWorkouts: number;
  totalOperations: number;
  operationTimes: number[];
  errors: string[];
  successRate: number;
  averageOperationTime: number;
  memoryUsage: Array<{
    stage: string;
    heapUsed: number;
    heapTotal: number;
    rss: number;
  }>;
}

class TypeScriptPerformanceTest {
  private storage: UnifiedFileStorage;
  private results: TestResults;
  private testStartTime: number;

  constructor() {
    this.storage = new UnifiedFileStorage(TEST_CONFIG.TEST_DATA_DIR);
    this.results = {
      totalUsers: 0,
      totalWorkouts: 0,
      totalOperations: 0,
      operationTimes: [],
      errors: [],
      successRate: 0,
      averageOperationTime: 0,
      memoryUsage: []
    };
    this.testStartTime = Date.now();
  }

  private recordMemoryUsage(stage: string): void {
    const memUsage = process.memoryUsage();
    this.results.memoryUsage.push({
      stage,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss
    });
  }

  private generateRealisticSetData() {
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

  private selectExercisesForWorkout(count: number) {
    const shuffled = [...EXERCISES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateWorkoutNotes(): string {
    const notes = [
      "Great workout, felt strong today!",
      "Struggled with the last few reps but pushed through",
      "Need to focus on form next time",
      "Increased weight from last session",
      "Felt tired but completed all sets",
      "Perfect form throughout the workout",
      "",
      "Quick session but effective"
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  private async timedOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    this.results.operationTimes.push(duration);
    return { result, duration };
  }

  private async createRealisticWorkout(userId: string, workoutIndex: number): Promise<boolean> {
    try {
      const workoutType = WORKOUT_TYPES[Math.floor(Math.random() * WORKOUT_TYPES.length)];
      const selectedExercises = this.selectExercisesForWorkout(TEST_CONFIG.EXERCISES_PER_WORKOUT);
      
      // Create workout session
      const { result: session } = await this.timedOperation(() =>
        this.storage.createUnifiedWorkoutSession(
          userId,
          workoutType,
          selectedExercises.map(e => e.name.toLowerCase().replace(/\s+/g, '-'))
        )
      );

      // Log exercises and sets
      for (const exercise of selectedExercises) {
        for (let setNum = 1; setNum <= TEST_CONFIG.SETS_PER_EXERCISE; setNum++) {
          const setData = this.generateRealisticSetData();
          setData.setNumber = setNum;
          
          await this.timedOperation(() =>
            this.storage.logSetToUnifiedStorage(
              userId,
              session.id,
              exercise.id,
              exercise.name,
              setData
            )
          );
        }
      }

      // Complete workout
      const rating = Math.floor(Math.random() * 5) + 1;
      const notes = this.generateWorkoutNotes();
      
      await this.timedOperation(() =>
        this.storage.completeUnifiedWorkoutSession(userId, session.id, rating, notes)
      );

      this.results.totalWorkouts++;
      return true;

    } catch (error) {
      this.results.errors.push(`User ${userId}, workout ${workoutIndex}: ${(error as Error).message}`);
      return false;
    }
  }

  private async testSingleUserPerformance(): Promise<void> {
    console.log('🏃‍♂️ Testing Single User Performance...');
    
    const userId = 'perf-user-single';
    
    for (let i = 0; i < TEST_CONFIG.WORKOUTS_PER_USER; i++) {
      await this.createRealisticWorkout(userId, i);
      if ((i + 1) % 3 === 0) {
        process.stdout.write(`\r   Workout ${i + 1}/${TEST_CONFIG.WORKOUTS_PER_USER} completed`);
      }
    }
    
    console.log('\n✅ Single user test completed');
    this.recordMemoryUsage('after_single_user');
  }

  private async testConcurrentUsers(): Promise<void> {
    console.log('👥 Testing Concurrent Users...');
    
    const userPromises: Promise<boolean[]>[] = [];
    
    for (let userId = 1; userId <= TEST_CONFIG.USER_COUNT; userId++) {
      const userIdStr = `perf-user-${userId}`;
      
      const userWorkouts: Promise<boolean>[] = [];
      for (let workoutIndex = 0; workoutIndex < TEST_CONFIG.WORKOUTS_PER_USER; workoutIndex++) {
        userWorkouts.push(this.createRealisticWorkout(userIdStr, workoutIndex));
      }
      
      userPromises.push(Promise.all(userWorkouts));
    }

    await Promise.all(userPromises);
    console.log('✅ Concurrent users test completed');
    this.recordMemoryUsage('after_concurrent_users');
  }

  private async testDataIsolation(): Promise<boolean> {
    console.log('🔒 Testing Data Isolation...');
    
    const user1Id = 'isolation-user-1';
    const user2Id = 'isolation-user-2';

    // Create workouts for different users
    await this.createRealisticWorkout(user1Id, 1);
    await this.createRealisticWorkout(user2Id, 1);

    // Verify data isolation
    const user1Data = await this.storage.getUserWorkoutData(user1Id);
    const user2Data = await this.storage.getUserWorkoutData(user2Id);

    const isolationPassed = user1Data.sessions.every(s => s.userId === user1Id) &&
                           user2Data.sessions.every(s => s.userId === user2Id) &&
                           user1Data.sessions.length > 0 &&
                           user2Data.sessions.length > 0;

    if (isolationPassed) {
      console.log('✅ Data isolation test PASSED');
    } else {
      console.log('❌ Data isolation test FAILED');
      this.results.errors.push('Data isolation failure detected');
    }

    return isolationPassed;
  }

  private async testDataIntegrity(): Promise<boolean> {
    console.log('🔍 Testing Data Integrity...');
    
    const userId = 'integrity-user';
    const success = await this.createRealisticWorkout(userId, 1);
    
    if (!success) {
      console.log('❌ Data integrity test FAILED - workout creation failed');
      return false;
    }

    // Validate the data
    const userData = await this.storage.getUserWorkoutData(userId);
    const session = userData.sessions[0];

    const integrityChecks = {
      sessionExists: !!session,
      sessionCompleted: session?.sessionType === 'completed',
      correctUserId: session?.userId === userId,
      exercisesPresent: session?.exercises && session.exercises.length > 0,
      setsPresent: session?.exercises?.every(e => e.sets && e.sets.length > 0),
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
      console.log('✅ Data integrity test PASSED');
    } else {
      console.log('❌ Data integrity test FAILED');
      Object.entries(integrityChecks).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`   - ${check}: FAILED`);
          this.results.errors.push(`Data integrity check failed: ${check}`);
        }
      });
    }

    return allPassed;
  }

  private calculateResults(): void {
    const totalOperations = this.results.operationTimes.length;
    const successfulOperations = totalOperations - this.results.errors.length;
    
    this.results.totalUsers = TEST_CONFIG.USER_COUNT + 3; // Including test users
    this.results.totalOperations = totalOperations;
    this.results.successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;
    this.results.averageOperationTime = totalOperations > 0 
      ? this.results.operationTimes.reduce((a, b) => a + b, 0) / totalOperations 
      : 0;
  }

  private generateReport(): void {
    const totalTestTime = Date.now() - this.testStartTime;
    
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`⏱️  Total Test Time: ${Math.round(totalTestTime / 1000)}s`);
    console.log(`👥 Users Tested: ${this.results.totalUsers}`);
    console.log(`🏋️  Workouts Created: ${this.results.totalWorkouts}`);
    console.log(`⚡ Total Operations: ${this.results.totalOperations}`);
    console.log(`⚡ Average Operation Time: ${Math.round(this.results.averageOperationTime)}ms`);
    console.log(`✅ Success Rate: ${this.results.successRate.toFixed(2)}%`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    
    if (this.results.memoryUsage.length > 0) {
      const maxMemory = Math.max(...this.results.memoryUsage.map(m => m.heapUsed));
      console.log(`🧠 Peak Memory Usage: ${Math.round(maxMemory / 1024 / 1024)}MB`);
    }

    // Performance assessment
    const performancePassed = this.results.averageOperationTime < 500 && 
                             this.results.successRate > 95 && 
                             this.results.errors.length === 0;

    if (performancePassed) {
      console.log('\n🎉 PERFORMANCE TEST PASSED - System ready for production!');
    } else {
      console.log('\n⚠️  PERFORMANCE ISSUES DETECTED:');
      if (this.results.averageOperationTime >= 500) {
        console.log('   - Average operation time too high (>500ms)');
      }
      if (this.results.successRate <= 95) {
        console.log('   - Success rate too low (<95%)');
      }
      if (this.results.errors.length > 0) {
        console.log('   - Errors occurred during testing');
        this.results.errors.forEach(error => console.log(`     • ${error}`));
      }
    }

    // Save detailed report
    const reportPath = path.join(TEST_CONFIG.TEST_DATA_DIR, 'performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: TEST_CONFIG,
      results: this.results,
      totalTestTime,
      performancePassed
    };

    fs.writeJSONSync(reportPath, report, { spaces: 2 });
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  private async cleanup(): Promise<void> {
    if (TEST_CONFIG.CLEANUP_AFTER_TEST) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await fs.remove(TEST_CONFIG.TEST_DATA_DIR);
        console.log('✅ Test data cleaned up successfully');
      } catch (error) {
        console.log('⚠️  Warning: Could not clean up test data:', (error as Error).message);
      }
    } else {
      console.log(`\n📁 Test data preserved at: ${TEST_CONFIG.TEST_DATA_DIR}`);
    }
  }

  public async run(): Promise<boolean> {
    try {
      console.log('🚀 Starting TypeScript Performance Test Suite');
      console.log(`📊 Configuration: ${TEST_CONFIG.USER_COUNT} users, ${TEST_CONFIG.WORKOUTS_PER_USER} workouts each\n`);

      // Clean up previous test data
      if (await fs.pathExists(TEST_CONFIG.TEST_DATA_DIR)) {
        await fs.remove(TEST_CONFIG.TEST_DATA_DIR);
      }

      await this.storage.initialize();
      this.recordMemoryUsage('initialization');

      // Run tests
      await this.testSingleUserPerformance();
      await this.testConcurrentUsers();
      const isolationPassed = await this.testDataIsolation();
      const integrityPassed = await this.testDataIntegrity();

      // Calculate and display results
      this.calculateResults();
      this.recordMemoryUsage('test_completion');
      this.generateReport();

      const allTestsPassed = isolationPassed && integrityPassed && 
                            this.results.successRate > 95 && 
                            this.results.averageOperationTime < 500;

      return allTestsPassed;

    } catch (error) {
      console.error('💥 Performance test failed:', (error as Error).message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const testSuite = new TypeScriptPerformanceTest();
  
  testSuite.run()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { TypeScriptPerformanceTest, TEST_CONFIG };