#!/usr/bin/env tsx

/**
 * Simple Storage Test to Debug Unified Storage Issues
 * 
 * This test will help identify the root cause of the "Workout session not found" errors
 * by testing storage operations in a controlled, sequential manner.
 */

import { UnifiedFileStorage } from './server/unifiedFileStorage';
import * as fs from 'fs-extra';

class SimpleStorageTest {
  private storage: UnifiedFileStorage;
  private testDataDir = './data/simple-test';

  constructor() {
    this.storage = new UnifiedFileStorage(this.testDataDir);
  }

  async initialize() {
    console.log('🔧 Initializing Simple Storage Test...');
    
    if (await fs.pathExists(this.testDataDir)) {
      await fs.remove(this.testDataDir);
    }
    
    await this.storage.initialize();
    console.log('✅ Storage initialized');
  }

  async testBasicWorkflow() {
    console.log('\n🏋️ Testing Basic Workout Workflow...');
    
    const userId = 'test-user-1';
    
    try {
      // Step 1: Create workout session
      console.log('   Creating workout session...');
      const session = await this.storage.createUnifiedWorkoutSession(
        userId,
        'Test Workout',
        ['bench-press', 'squats']
      );
      console.log(`   ✅ Session created: ${session.id}`);

      // Step 2: Verify session exists
      console.log('   Verifying session exists...');
      const userData = await this.storage.getUserWorkoutData(userId);
      const foundSession = userData.sessions.find(s => s.id === session.id);
      if (!foundSession) {
        throw new Error('Session not found immediately after creation');
      }
      console.log(`   ✅ Session verified in user data`);

      // Step 3: Log a set
      console.log('   Logging a set...');
      const setResult = await this.storage.logSetToUnifiedStorage(
        userId,
        session.id,
        1,
        'Bench Press',
        {
          setNumber: 1,
          weight: 135,
          reps: 10,
          formScore: 8,
          equipment: 'Barbell'
        }
      );
      console.log(`   ✅ Set logged successfully, volume: ${setResult.totalVolume}`);

      // Step 4: Verify set was saved
      console.log('   Verifying set was saved...');
      const updatedUserData = await this.storage.getUserWorkoutData(userId);
      const updatedSession = updatedUserData.sessions.find(s => s.id === session.id);
      if (!updatedSession || updatedSession.exercises.length === 0) {
        throw new Error('Set not found in saved data');
      }
      console.log(`   ✅ Set verified: ${updatedSession.exercises[0].sets.length} sets found`);

      // Step 5: Complete workout
      console.log('   Completing workout...');
      const completion = await this.storage.completeUnifiedWorkoutSession(
        userId,
        session.id,
        4,
        'Test workout completed successfully'
      );
      console.log(`   ✅ Workout completed: ${completion.duration}min, ${completion.totalVolume} volume`);

      // Step 6: Final verification
      console.log('   Final verification...');
      const finalUserData = await this.storage.getUserWorkoutData(userId);
      const completedSession = finalUserData.sessions.find(s => s.id === session.id);
      if (!completedSession || completedSession.sessionType !== 'completed') {
        throw new Error('Session not marked as completed');
      }
      console.log(`   ✅ Session properly completed and saved`);

      return true;

    } catch (error) {
      console.error(`   ❌ Basic workflow failed: ${(error as Error).message}`);
      return false;
    }
  }

  async testMultipleUsers() {
    console.log('\n👥 Testing Multiple Users Sequentially...');
    
    const users = ['user-1', 'user-2', 'user-3'];
    let successCount = 0;

    for (const userId of users) {
      try {
        console.log(`   Testing user: ${userId}`);
        
        // Create session
        const session = await this.storage.createUnifiedWorkoutSession(
          userId,
          'Multi-User Test',
          ['squats']
        );

        // Log a set
        await this.storage.logSetToUnifiedStorage(
          userId,
          session.id,
          2,
          'Squats',
          {
            setNumber: 1,
            weight: 185,
            reps: 8,
            formScore: 9,
            equipment: 'Barbell'
          }
        );

        // Complete workout
        await this.storage.completeUnifiedWorkoutSession(userId, session.id, 5, 'Good workout');

        // Verify isolation
        const userData = await this.storage.getUserWorkoutData(userId);
        if (userData.sessions.every(s => s.userId === userId)) {
          console.log(`     ✅ ${userId}: Data isolation maintained`);
          successCount++;
        } else {
          console.log(`     ❌ ${userId}: Data isolation violated`);
        }

      } catch (error) {
        console.error(`     ❌ ${userId}: Failed - ${(error as Error).message}`);
      }
    }

    console.log(`   Results: ${successCount}/${users.length} users successful`);
    return successCount === users.length;
  }

  async testConcurrentOperations() {
    console.log('\n⚡ Testing Concurrent Operations (Limited)...');
    
    const userId = 'concurrent-user';
    
    try {
      // Create a session first
      const session = await this.storage.createUnifiedWorkoutSession(
        userId,
        'Concurrent Test',
        ['bench-press', 'rows']
      );

      console.log('   Creating multiple sets concurrently...');
      
      // Try to log multiple sets at the same time (this might reveal race conditions)
      const setPromises = [
        this.storage.logSetToUnifiedStorage(userId, session.id, 1, 'Bench Press', {
          setNumber: 1, weight: 135, reps: 10, formScore: 8, equipment: 'Barbell'
        }),
        this.storage.logSetToUnifiedStorage(userId, session.id, 1, 'Bench Press', {
          setNumber: 2, weight: 145, reps: 8, formScore: 8, equipment: 'Barbell'
        }),
        this.storage.logSetToUnifiedStorage(userId, session.id, 2, 'Rows', {
          setNumber: 1, weight: 115, reps: 10, formScore: 9, equipment: 'Barbell'
        })
      ];

      const results = await Promise.all(setPromises);
      const successfulSets = results.filter(r => r.success).length;
      
      console.log(`   ✅ ${successfulSets}/${results.length} concurrent sets logged successfully`);

      // Verify data integrity
      const userData = await this.storage.getUserWorkoutData(userId);
      const testSession = userData.sessions.find(s => s.id === session.id);
      const totalSets = testSession?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;
      
      console.log(`   ✅ Total sets found in storage: ${totalSets}`);

      // Complete the session
      await this.storage.completeUnifiedWorkoutSession(userId, session.id, 4, 'Concurrent test');
      
      return successfulSets === 3 && totalSets === 3;

    } catch (error) {
      console.error(`   ❌ Concurrent operations failed: ${(error as Error).message}`);
      return false;
    }
  }

  async testDataPersistence() {
    console.log('\n💾 Testing Data Persistence...');
    
    const userId = 'persistence-user';
    let sessionId: string;

    try {
      // Create and complete a workout
      const session = await this.storage.createUnifiedWorkoutSession(userId, 'Persistence Test');
      sessionId = session.id;

      await this.storage.logSetToUnifiedStorage(userId, sessionId, 1, 'Test Exercise', {
        setNumber: 1, weight: 100, reps: 10, formScore: 8, equipment: 'Test'
      });

      await this.storage.completeUnifiedWorkoutSession(userId, sessionId, 5, 'Persistence test');

      // Create a new storage instance to test file persistence
      const newStorage = new UnifiedFileStorage(this.testDataDir);
      const userData = await newStorage.getUserWorkoutData(userId);
      
      const persistedSession = userData.sessions.find(s => s.id === sessionId);
      if (persistedSession && persistedSession.sessionType === 'completed') {
        console.log('   ✅ Data persisted correctly across storage instances');
        return true;
      } else {
        console.log('   ❌ Data not persisted correctly');
        return false;
      }

    } catch (error) {
      console.error(`   ❌ Persistence test failed: ${(error as Error).message}`);
      return false;
    }
  }

  async testActiveSessionHandling() {
    console.log('\n🔄 Testing Active Session Handling...');
    
    const userId = 'active-session-user';

    try {
      // Create first session
      const session1 = await this.storage.createUnifiedWorkoutSession(userId, 'Session 1');
      console.log('   ✅ First session created');

      // Try to create second session (should fail due to active session)
      try {
        await this.storage.createUnifiedWorkoutSession(userId, 'Session 2');
        console.log('   ❌ Second session created (should have failed)');
        return false;
      } catch (error) {
        console.log('   ✅ Second session correctly rejected (active session exists)');
      }

      // Complete first session
      await this.storage.completeUnifiedWorkoutSession(userId, session1.id, 4, 'First session done');
      console.log('   ✅ First session completed');

      // Now try to create second session (should succeed)
      const session2 = await this.storage.createUnifiedWorkoutSession(userId, 'Session 2');
      console.log('   ✅ Second session created after first was completed');

      // Cleanup
      await this.storage.completeUnifiedWorkoutSession(userId, session2.id, 4, 'Second session done');

      return true;

    } catch (error) {
      console.error(`   ❌ Active session handling failed: ${(error as Error).message}`);
      return false;
    }
  }

  async generateReport(results: Record<string, boolean>) {
    console.log('\n📊 SIMPLE STORAGE TEST RESULTS');
    console.log('='.repeat(50));

    const testNames = {
      basicWorkflow: 'Basic Workout Workflow',
      multipleUsers: 'Multiple Users Sequential',
      concurrentOps: 'Concurrent Operations',
      dataPersistence: 'Data Persistence',
      activeSessionHandling: 'Active Session Handling'
    };

    let passedTests = 0;
    const totalTests = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${testNames[test as keyof typeof testNames]}: ${status}`);
      if (passed) passedTests++;
    });

    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Storage system working correctly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Storage system needs attention');
    }

    // Save report
    const reportPath = `${this.testDataDir}/simple-test-report.json`;
    const report = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        overallPassed: passedTests === totalTests
      }
    };

    await fs.writeJSON(reportPath, report, { spaces: 2 });
    console.log(`\nDetailed report saved to: ${reportPath}`);

    return passedTests === totalTests;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    try {
      await fs.remove(this.testDataDir);
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️  Warning: Could not clean up test data');
    }
  }

  async run() {
    try {
      await this.initialize();

      const results = {
        basicWorkflow: await this.testBasicWorkflow(),
        multipleUsers: await this.testMultipleUsers(),
        concurrentOps: await this.testConcurrentOperations(),
        dataPersistence: await this.testDataPersistence(),
        activeSessionHandling: await this.testActiveSessionHandling()
      };

      const allPassed = await this.generateReport(results);
      return allPassed;

    } catch (error) {
      console.error('💥 Simple storage test failed:', (error as Error).message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const simpleTest = new SimpleStorageTest();
  
  simpleTest.run()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { SimpleStorageTest };