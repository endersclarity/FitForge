#!/usr/bin/env node

/**
 * Concurrent Stress Test for Unified Storage System
 * 
 * Focuses specifically on testing concurrent operations that could happen
 * in a real multi-user web application environment:
 * - Multiple users logging sets simultaneously
 * - Session creation/completion overlap
 * - Read/write race conditions
 * - File locking and data consistency
 */

const { UnifiedFileStorage } = require('./server/unifiedFileStorage');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const STRESS_CONFIG = {
  CONCURRENT_USERS: 5,
  OPERATIONS_PER_USER: 10,
  MAX_CONCURRENT_OPS: 20,
  TEST_DATA_DIR: './data/stress-test',
  OPERATION_DELAY_MS: 50 // Small delay to simulate network latency
};

class ConcurrentStressTest {
  constructor() {
    this.storage = new UnifiedFileStorage(STRESS_CONFIG.TEST_DATA_DIR);
    this.results = {
      operations: [],
      errors: [],
      raceConditions: [],
      dataConsistencyIssues: []
    };
  }

  async initialize() {
    console.log('🚀 Starting Concurrent Stress Test');
    console.log(`Configuration:
    - Concurrent Users: ${STRESS_CONFIG.CONCURRENT_USERS}
    - Operations per User: ${STRESS_CONFIG.OPERATIONS_PER_USER}
    - Max Concurrent Operations: ${STRESS_CONFIG.MAX_CONCURRENT_OPS}
    `);

    if (await fs.pathExists(STRESS_CONFIG.TEST_DATA_DIR)) {
      await fs.remove(STRESS_CONFIG.TEST_DATA_DIR);
    }

    await this.storage.initialize();
  }

  async simulateUserWorkflow(userId, operationId) {
    const startTime = Date.now();
    const results = {
      userId,
      operationId,
      operations: [],
      errors: [],
      duration: 0
    };

    try {
      // 1. Create workout session
      const sessionCreation = await this.timedOperation(
        () => this.storage.createUnifiedWorkoutSession(userId, 'Push Workout', ['bench-press', 'pushups']),
        'createSession'
      );
      results.operations.push(sessionCreation);

      if (!sessionCreation.success) {
        throw new Error('Failed to create session');
      }

      const sessionId = sessionCreation.result.id;

      // 2. Log multiple sets rapidly (simulating quick logging)
      const setPromises = [];
      for (let i = 1; i <= 5; i++) {
        setPromises.push(
          this.timedOperation(
            () => this.storage.logSetToUnifiedStorage(
              userId,
              sessionId,
              1,
              'Bench Press',
              {
                setNumber: i,
                weight: 135 + (i * 5),
                reps: 10 - i,
                formScore: 8,
                equipment: 'Barbell'
              }
            ),
            `logSet${i}`
          )
        );
      }

      // Execute all set logging concurrently
      const setResults = await Promise.all(setPromises);
      results.operations.push(...setResults);

      // 3. Read data to verify consistency
      const dataRead = await this.timedOperation(
        () => this.storage.getUserWorkoutData(userId),
        'readData'
      );
      results.operations.push(dataRead);

      // 4. Complete workout
      const completion = await this.timedOperation(
        () => this.storage.completeUnifiedWorkoutSession(userId, sessionId, 4, 'Good workout'),
        'completeSession'
      );
      results.operations.push(completion);

      // 5. Final data consistency check
      const finalRead = await this.timedOperation(
        () => this.storage.getUserWorkoutData(userId),
        'finalRead'
      );
      results.operations.push(finalRead);

      // Validate data consistency
      if (finalRead.success && dataRead.success) {
        const finalData = finalRead.result;
        const session = finalData.sessions.find(s => s.id === sessionId);
        
        if (session) {
          if (session.exercises.length === 0) {
            results.errors.push('No exercises found in completed session');
          }
          
          const benchPress = session.exercises.find(e => e.exerciseName === 'Bench Press');
          if (benchPress && benchPress.sets.length !== 5) {
            results.errors.push(`Expected 5 sets, found ${benchPress.sets.length}`);
          }
          
          if (session.sessionType !== 'completed') {
            results.errors.push(`Session not marked as completed: ${session.sessionType}`);
          }
        } else {
          results.errors.push('Completed session not found in user data');
        }
      }

    } catch (error) {
      results.errors.push(error.message);
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  async timedOperation(operation, operationName) {
    const startTime = Date.now();
    try {
      // Add small delay to simulate network latency
      if (STRESS_CONFIG.OPERATION_DELAY_MS > 0) {
        await this.delay(STRESS_CONFIG.OPERATION_DELAY_MS);
      }

      const result = await operation();
      const duration = Date.now() - startTime;

      return {
        operationName,
        success: true,
        duration,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        operationName,
        success: false,
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runConcurrentOperations() {
    console.log('👥 Running concurrent user operations...');
    
    const userPromises = [];
    for (let i = 1; i <= STRESS_CONFIG.CONCURRENT_USERS; i++) {
      const userId = `stress-user-${i}`;
      
      for (let j = 1; j <= STRESS_CONFIG.OPERATIONS_PER_USER; j++) {
        const operationId = `${userId}-op-${j}`;
        userPromises.push(this.simulateUserWorkflow(userId, operationId));
      }
    }

    // Run all operations concurrently
    const startTime = Date.now();
    const results = await Promise.all(userPromises);
    const totalDuration = Date.now() - startTime;

    console.log(`✅ Completed ${results.length} concurrent operations in ${totalDuration}ms`);

    return { results, totalDuration };
  }

  async testDataConsistency() {
    console.log('🔍 Testing data consistency after concurrent operations...');
    
    const consistencyIssues = [];
    
    for (let i = 1; i <= STRESS_CONFIG.CONCURRENT_USERS; i++) {
      const userId = `stress-user-${i}`;
      
      try {
        const userData = await this.storage.getUserWorkoutData(userId);
        
        // Check if user has expected number of sessions
        const expectedSessions = STRESS_CONFIG.OPERATIONS_PER_USER;
        if (userData.sessions.length !== expectedSessions) {
          consistencyIssues.push({
            userId,
            issue: 'session_count_mismatch',
            expected: expectedSessions,
            actual: userData.sessions.length
          });
        }

        // Check session integrity
        for (const session of userData.sessions) {
          if (session.userId !== userId) {
            consistencyIssues.push({
              userId,
              issue: 'wrong_user_id_in_session',
              sessionId: session.id,
              sessionUserId: session.userId
            });
          }

          if (session.sessionType === 'completed' && !session.endTime) {
            consistencyIssues.push({
              userId,
              issue: 'completed_session_missing_end_time',
              sessionId: session.id
            });
          }

          // Check exercise data
          for (const exercise of session.exercises) {
            if (exercise.sets.length === 0) {
              consistencyIssues.push({
                userId,
                issue: 'exercise_with_no_sets',
                sessionId: session.id,
                exerciseName: exercise.exerciseName
              });
            }

            // Check set volume calculations
            for (const set of exercise.sets) {
              const calculatedVolume = set.weight * set.reps;
              if (Math.abs(set.volume - calculatedVolume) > 0.01) {
                consistencyIssues.push({
                  userId,
                  issue: 'incorrect_volume_calculation',
                  sessionId: session.id,
                  exerciseName: exercise.exerciseName,
                  setNumber: set.setNumber,
                  expected: calculatedVolume,
                  actual: set.volume
                });
              }
            }
          }
        }

        // Check aggregations
        const completedSessions = userData.sessions.filter(s => s.sessionType === 'completed');
        if (userData.aggregations.totalWorkouts !== completedSessions.length) {
          consistencyIssues.push({
            userId,
            issue: 'incorrect_total_workouts',
            expected: completedSessions.length,
            actual: userData.aggregations.totalWorkouts
          });
        }

      } catch (error) {
        consistencyIssues.push({
          userId,
          issue: 'data_read_error',
          error: error.message
        });
      }
    }

    if (consistencyIssues.length === 0) {
      console.log('✅ No data consistency issues found');
    } else {
      console.log(`❌ Found ${consistencyIssues.length} data consistency issues`);
      consistencyIssues.forEach(issue => {
        console.log(`   - ${issue.userId}: ${issue.issue}`, 
          issue.expected ? `(expected: ${issue.expected}, actual: ${issue.actual})` : '');
      });
    }

    return consistencyIssues;
  }

  async testFileSystemStress() {
    console.log('💾 Testing file system stress with rapid operations...');
    
    const userId = 'filesystem-stress-user';
    const session = await this.storage.createUnifiedWorkoutSession(userId, 'File Stress Test');
    
    // Rapidly log sets to stress the file system
    const rapidOperations = [];
    for (let i = 1; i <= 50; i++) {
      rapidOperations.push(
        this.storage.logSetToUnifiedStorage(
          userId,
          session.id,
          1,
          'Rapid Exercise',
          {
            setNumber: i,
            weight: 100,
            reps: 10,
            formScore: 8,
            equipment: 'Test'
          }
        )
      );
    }

    const startTime = Date.now();
    const results = await Promise.all(rapidOperations);
    const duration = Date.now() - startTime;

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    console.log(`   Completed ${results.length} rapid operations in ${duration}ms`);
    console.log(`   Success rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
    
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} operations failed`);
    } else {
      console.log(`   ✅ All operations succeeded`);
    }

    // Verify final data integrity
    const finalData = await this.storage.getUserWorkoutData(userId);
    const stressSession = finalData.sessions.find(s => s.id === session.id);
    const rapidExercise = stressSession?.exercises?.find(e => e.exerciseName === 'Rapid Exercise');

    const expectedSets = 50;
    const actualSets = rapidExercise?.sets?.length || 0;

    if (actualSets === expectedSets) {
      console.log(`   ✅ Data integrity verified: ${actualSets}/${expectedSets} sets preserved`);
    } else {
      console.log(`   ❌ Data integrity issue: ${actualSets}/${expectedSets} sets preserved`);
    }

    return {
      operations: results.length,
      duration,
      successRate: (successCount / results.length) * 100,
      dataIntegrityPassed: actualSets === expectedSets
    };
  }

  async generateStressReport() {
    console.log('\n📊 CONCURRENT STRESS TEST RESULTS');
    console.log('='.repeat(50));

    const { results, totalDuration } = await this.runConcurrentOperations();
    const consistencyIssues = await this.testDataConsistency();
    const fileSystemResults = await this.testFileSystemStress();

    // Calculate statistics
    const totalOperations = results.reduce((sum, r) => sum + r.operations.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const allOperations = results.flatMap(r => r.operations);
    
    const successfulOps = allOperations.filter(op => op.success);
    const failedOps = allOperations.filter(op => !op.success);
    
    const avgDuration = successfulOps.length > 0 
      ? successfulOps.reduce((sum, op) => sum + op.duration, 0) / successfulOps.length 
      : 0;

    const operationTypes = {};
    allOperations.forEach(op => {
      operationTypes[op.operationName] = (operationTypes[op.operationName] || 0) + 1;
    });

    const report = {
      summary: {
        totalConcurrentUsers: STRESS_CONFIG.CONCURRENT_USERS,
        totalOperations,
        successfulOperations: successfulOps.length,
        failedOperations: failedOps.length,
        successRate: (successfulOps.length / totalOperations) * 100,
        totalDuration,
        averageOperationDuration: avgDuration
      },
      performance: {
        operationCounts: operationTypes,
        fastestOperation: Math.min(...successfulOps.map(op => op.duration)),
        slowestOperation: Math.max(...successfulOps.map(op => op.duration)),
        operationsPerSecond: totalOperations / (totalDuration / 1000)
      },
      dataConsistency: {
        issuesFound: consistencyIssues.length,
        issues: consistencyIssues
      },
      fileSystemStress: fileSystemResults,
      userResults: results
    };

    console.log(`👥 Concurrent Users: ${report.summary.totalConcurrentUsers}`);
    console.log(`⚡ Total Operations: ${report.summary.totalOperations}`);
    console.log(`✅ Success Rate: ${report.summary.successRate.toFixed(2)}%`);
    console.log(`⏱️  Average Operation Time: ${Math.round(avgDuration)}ms`);
    console.log(`🚀 Operations/Second: ${report.performance.operationsPerSecond.toFixed(2)}`);
    console.log(`🔍 Data Consistency Issues: ${report.dataConsistency.issuesFound}`);
    console.log(`💾 File System Stress: ${fileSystemResults.successRate.toFixed(2)}% success rate`);

    // Save detailed report
    const reportPath = path.join(STRESS_CONFIG.TEST_DATA_DIR, 'stress-test-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up stress test data...');
    try {
      await fs.remove(STRESS_CONFIG.TEST_DATA_DIR);
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️  Warning: Could not clean up test data:', error.message);
    }
  }

  async run() {
    try {
      await this.initialize();
      const report = await this.generateStressReport();
      
      // Determine if test passed
      const passed = report.summary.successRate >= 95 && 
                   report.dataConsistency.issuesFound === 0 &&
                   report.fileSystemStress.dataIntegrityPassed;

      if (passed) {
        console.log('\n🎉 STRESS TEST PASSED - System handles concurrent load well!');
      } else {
        console.log('\n⚠️  STRESS TEST ISSUES DETECTED - Review results for details');
      }

      return report;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use in other tests
module.exports = { ConcurrentStressTest, STRESS_CONFIG };

// Run if called directly
if (require.main === module) {
  const stressTest = new ConcurrentStressTest();
  
  stressTest.run()
    .then(report => {
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Stress test failed:', error);
      process.exit(1);
    });
}