#!/usr/bin/env node

/**
 * Data Migration Test for Unified Storage System
 * 
 * Tests the migration functionality that converts existing data to the new
 * unified storage format. This is critical for users who have existing
 * workout data in the old format.
 */

const { UnifiedFileStorage } = require('./server/unifiedFileStorage');
const fs = require('fs-extra');
const path = require('path');

const MIGRATION_CONFIG = {
  TEST_DATA_DIR: './data/migration-test',
  PRESERVE_ORIGINAL: true
};

class DataMigrationTest {
  constructor() {
    this.storage = new UnifiedFileStorage(MIGRATION_CONFIG.TEST_DATA_DIR);
    this.testResults = {
      legacySessionsMigrated: 0,
      workoutLogsMigrated: 0,
      errors: [],
      dataLoss: [],
      dataCorrectness: []
    };
  }

  async initialize() {
    console.log('🔄 Starting Data Migration Test');
    
    if (await fs.pathExists(MIGRATION_CONFIG.TEST_DATA_DIR)) {
      await fs.remove(MIGRATION_CONFIG.TEST_DATA_DIR);
    }
    
    await this.storage.initialize();
    await this.createTestData();
  }

  async createTestData() {
    console.log('📝 Creating test data in legacy formats...');

    const userId = 'migration-test-user';
    const userDir = path.join(MIGRATION_CONFIG.TEST_DATA_DIR, 'users', userId);
    await fs.ensureDir(userDir);

    // 1. Create legacy structured sessions (old workouts.json format)
    const legacySessions = [
      {
        id: 'legacy-session-1',
        date: '2025-06-01T10:00:00.000Z',
        workoutType: 'Chest & Triceps',
        duration: 45,
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 135, reps: 10, volume: 1350 },
              { weight: 145, reps: 8, volume: 1160 },
              { weight: 155, reps: 6, volume: 930 }
            ]
          },
          {
            name: 'Tricep Dips',
            sets: [
              { weight: 0, reps: 12, volume: 0 },
              { weight: 0, reps: 10, volume: 0 },
              { weight: 0, reps: 8, volume: 0 }
            ]
          }
        ],
        totalVolume: 3440,
        completed: true
      },
      {
        id: 'legacy-session-2',
        date: '2025-06-02T14:30:00.000Z',
        workoutType: 'Back & Biceps',
        duration: 50,
        exercises: [
          {
            name: 'Pull Ups',
            sets: [
              { weight: 0, reps: 8, volume: 0 },
              { weight: 0, reps: 7, volume: 0 },
              { weight: 0, reps: 6, volume: 0 }
            ]
          },
          {
            name: 'Bent Over Row',
            sets: [
              { weight: 115, reps: 10, volume: 1150 },
              { weight: 125, reps: 8, volume: 1000 },
              { weight: 135, reps: 6, volume: 810 }
            ]
          }
        ],
        totalVolume: 2960,
        completed: true
      }
    ];

    await fs.writeJSON(path.join(userDir, 'workouts.json'), legacySessions, { spaces: 2 });

    // 2. Create simple workout logs (old workout-logs format)
    const workoutLogsDir = path.join(MIGRATION_CONFIG.TEST_DATA_DIR, 'workout-logs');
    await fs.ensureDir(workoutLogsDir);

    const simpleWorkoutLogs = [
      {
        sessionId: 'simple-session-1',
        userId: userId,
        timestamp: '2025-06-03T09:00:00.000Z',
        exerciseId: 1,
        exerciseName: 'Squats',
        weight: 185,
        reps: 10,
        setNumber: 1,
        volume: 1850
      },
      {
        sessionId: 'simple-session-1',
        userId: userId,
        timestamp: '2025-06-03T09:03:00.000Z',
        exerciseId: 1,
        exerciseName: 'Squats',
        weight: 195,
        reps: 8,
        setNumber: 2,
        volume: 1560
      },
      {
        sessionId: 'simple-session-1',
        userId: userId,
        timestamp: '2025-06-03T09:06:00.000Z',
        exerciseId: 1,
        exerciseName: 'Squats',
        weight: 205,
        reps: 6,
        setNumber: 3,
        volume: 1230
      },
      {
        sessionId: 'simple-session-2',
        userId: userId,
        timestamp: '2025-06-04T16:00:00.000Z',
        exerciseId: 2,
        exerciseName: 'Deadlift',
        weight: 225,
        reps: 5,
        setNumber: 1,
        volume: 1125
      },
      {
        sessionId: 'simple-session-2',
        userId: userId,
        timestamp: '2025-06-04T16:04:00.000Z',
        exerciseId: 2,
        exerciseName: 'Deadlift',
        weight: 245,
        reps: 3,
        setNumber: 2,
        volume: 735
      }
    ];

    await fs.writeJSON(path.join(workoutLogsDir, 'workout-2025-06-03.json'), 
      simpleWorkoutLogs.filter(log => log.sessionId === 'simple-session-1'), 
      { spaces: 2 });

    await fs.writeJSON(path.join(workoutLogsDir, 'workout-2025-06-04.json'), 
      simpleWorkoutLogs.filter(log => log.sessionId === 'simple-session-2'), 
      { spaces: 2 });

    console.log('✅ Test data created:');
    console.log(`   - 2 legacy structured sessions`);
    console.log(`   - 2 simple workout log sessions (5 total log entries)`);
  }

  async runMigration() {
    console.log('\n🔄 Running data migration...');
    
    const userId = 'migration-test-user';
    const migrationResult = await this.storage.migrateToUnifiedStorage(userId);
    
    this.testResults.legacySessionsMigrated = migrationResult.migratedSessions;
    this.testResults.workoutLogsMigrated = migrationResult.migratedLogs;
    this.testResults.errors = migrationResult.errors;

    console.log(`✅ Migration completed:`);
    console.log(`   - Legacy sessions migrated: ${migrationResult.migratedSessions}`);
    console.log(`   - Workout logs migrated: ${migrationResult.migratedLogs}`);
    console.log(`   - Errors: ${migrationResult.errors.length}`);

    if (migrationResult.errors.length > 0) {
      console.log('\n❌ Migration errors:');
      migrationResult.errors.forEach(error => console.log(`   - ${error}`));
    }

    return migrationResult;
  }

  async validateMigratedData() {
    console.log('\n🔍 Validating migrated data...');
    
    const userId = 'migration-test-user';
    const userData = await this.storage.getUserWorkoutData(userId);

    console.log(`📊 Unified data summary:`);
    console.log(`   - Total sessions: ${userData.sessions.length}`);
    console.log(`   - Total workouts (aggregation): ${userData.aggregations.totalWorkouts}`);
    console.log(`   - Total volume (aggregation): ${userData.aggregations.totalVolume}`);

    // Validate data correctness
    const validationResults = {
      sessionCount: userData.sessions.length,
      expectedSessions: 4, // 2 legacy + 2 from logs
      allSessionsCompleted: userData.sessions.every(s => s.sessionType === 'completed'),
      exerciseDataPresent: userData.sessions.every(s => s.exercises && s.exercises.length > 0),
      volumeCalculationsCorrect: true,
      dataIntegrityIssues: []
    };

    // Check each session for data integrity
    userData.sessions.forEach((session, index) => {
      const sessionCheck = {
        sessionId: session.id,
        issues: []
      };

      // Check required fields
      if (!session.startTime) sessionCheck.issues.push('Missing start time');
      if (!session.workoutType) sessionCheck.issues.push('Missing workout type');
      if (!session.userId || session.userId !== userId) sessionCheck.issues.push('Incorrect user ID');

      // Check exercises
      session.exercises.forEach(exercise => {
        if (!exercise.exerciseName) sessionCheck.issues.push(`Exercise missing name`);
        if (!exercise.sets || exercise.sets.length === 0) sessionCheck.issues.push(`Exercise ${exercise.exerciseName} has no sets`);

        // Check volume calculations
        exercise.sets.forEach(set => {
          const calculatedVolume = set.weight * set.reps;
          if (Math.abs(set.volume - calculatedVolume) > 0.01) {
            sessionCheck.issues.push(`Volume calculation error in ${exercise.exerciseName}, set ${set.setNumber}`);
            validationResults.volumeCalculationsCorrect = false;
          }
        });
      });

      if (sessionCheck.issues.length > 0) {
        validationResults.dataIntegrityIssues.push(sessionCheck);
      }
    });

    // Validate specific expected data
    const expectedExercises = ['Bench Press', 'Tricep Dips', 'Pull Ups', 'Bent Over Row', 'Squats', 'Deadlift'];
    const foundExercises = new Set();
    
    userData.sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        foundExercises.add(exercise.exerciseName);
      });
    });

    const missingExercises = expectedExercises.filter(ex => !foundExercises.has(ex));
    if (missingExercises.length > 0) {
      validationResults.dataIntegrityIssues.push({
        sessionId: 'global',
        issues: [`Missing exercises: ${missingExercises.join(', ')}`]
      });
    }

    // Check aggregations
    const completedSessions = userData.sessions.filter(s => s.sessionType === 'completed');
    if (userData.aggregations.totalWorkouts !== completedSessions.length) {
      validationResults.dataIntegrityIssues.push({
        sessionId: 'aggregations',
        issues: [`Incorrect total workouts: expected ${completedSessions.length}, got ${userData.aggregations.totalWorkouts}`]
      });
    }

    this.testResults.dataCorrectness.push(validationResults);

    console.log('\n📋 Validation Results:');
    console.log(`   ✅ Session count: ${validationResults.sessionCount}/${validationResults.expectedSessions}`);
    console.log(`   ✅ All sessions completed: ${validationResults.allSessionsCompleted}`);
    console.log(`   ✅ Exercise data present: ${validationResults.exerciseDataPresent}`);
    console.log(`   ✅ Volume calculations: ${validationResults.volumeCalculationsCorrect}`);
    console.log(`   ✅ Found exercises: ${foundExercises.size}/${expectedExercises.length}`);

    if (validationResults.dataIntegrityIssues.length > 0) {
      console.log('\n❌ Data integrity issues found:');
      validationResults.dataIntegrityIssues.forEach(issue => {
        console.log(`   Session ${issue.sessionId}:`);
        issue.issues.forEach(problem => console.log(`     - ${problem}`));
      });
    } else {
      console.log('\n✅ No data integrity issues found');
    }

    return validationResults;
  }

  async testProgressiveOverloadMigration() {
    console.log('\n💪 Testing progressive overload data after migration...');
    
    const userId = 'migration-test-user';
    
    // Create a new workout session to test progressive overload recommendations
    const newSession = await this.storage.createUnifiedWorkoutSession(userId, 'Progressive Test');
    
    // Log a bench press set (should have progressive overload data from migrated sessions)
    const setResult = await this.storage.logSetToUnifiedStorage(
      userId,
      newSession.id,
      1,
      'Bench Press',
      {
        setNumber: 1,
        weight: 165, // Higher than previous best (155)
        reps: 5,
        formScore: 9,
        equipment: 'Barbell'
      }
    );

    // Complete the session
    await this.storage.completeUnifiedWorkoutSession(userId, newSession.id, 5, 'Testing progressive overload');

    // Check if progressive overload data was calculated
    const userData = await this.storage.getUserWorkoutData(userId);
    const testSession = userData.sessions.find(s => s.id === newSession.id);
    const benchPressExercise = testSession?.exercises?.find(e => e.exerciseName === 'Bench Press');

    const hasProgressiveOverload = !!benchPressExercise?.progressiveOverload;
    const hasPersonalRecord = testSession?.personalRecords?.some(pr => pr.exerciseName === 'Bench Press');

    console.log(`   Progressive overload data: ${hasProgressiveOverload ? '✅' : '❌'}`);
    console.log(`   Personal record detected: ${hasPersonalRecord ? '✅' : '❌'}`);

    if (hasProgressiveOverload) {
      const po = benchPressExercise.progressiveOverload;
      console.log(`   Previous best weight: ${po.previousBestWeight}lbs`);
      console.log(`   Recommended weight: ${po.recommendedWeight}lbs`);
      console.log(`   Progress percentage: ${po.progressPercentage.toFixed(2)}%`);
    }

    return {
      hasProgressiveOverload,
      hasPersonalRecord,
      progressiveOverloadData: benchPressExercise?.progressiveOverload
    };
  }

  async generateMigrationReport() {
    console.log('\n📊 MIGRATION TEST RESULTS');
    console.log('='.repeat(50));

    const migrationResult = await this.runMigration();
    const validationResult = await this.validateMigratedData();
    const progressiveOverloadResult = await this.testProgressiveOverloadMigration();

    const report = {
      migration: {
        legacySessionsMigrated: this.testResults.legacySessionsMigrated,
        workoutLogsMigrated: this.testResults.workoutLogsMigrated,
        totalErrors: this.testResults.errors.length,
        errors: this.testResults.errors
      },
      validation: validationResult,
      progressiveOverload: progressiveOverloadResult,
      overall: {
        migrationSuccessful: this.testResults.errors.length === 0,
        dataIntegrityPassed: validationResult.dataIntegrityIssues.length === 0,
        expectedDataMigrated: validationResult.sessionCount === validationResult.expectedSessions,
        progressiveOverloadWorking: progressiveOverloadResult.hasProgressiveOverload
      }
    };

    const allTestsPassed = report.overall.migrationSuccessful && 
                          report.overall.dataIntegrityPassed && 
                          report.overall.expectedDataMigrated &&
                          report.overall.progressiveOverloadWorking;

    console.log(`🔄 Migration Status: ${report.overall.migrationSuccessful ? '✅ Success' : '❌ Failed'}`);
    console.log(`📊 Data Integrity: ${report.overall.dataIntegrityPassed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`📈 Data Completeness: ${report.overall.expectedDataMigrated ? '✅ Complete' : '❌ Incomplete'}`);
    console.log(`💪 Progressive Overload: ${report.overall.progressiveOverloadWorking ? '✅ Working' : '❌ Not Working'}`);

    console.log(`\n📈 Migration Summary:`);
    console.log(`   - Legacy sessions: ${report.migration.legacySessionsMigrated}`);
    console.log(`   - Workout logs: ${report.migration.workoutLogsMigrated}`);
    console.log(`   - Total unified sessions: ${validationResult.sessionCount}`);
    console.log(`   - Migration errors: ${report.migration.totalErrors}`);

    if (allTestsPassed) {
      console.log('\n🎉 MIGRATION TEST PASSED - Data migration working correctly!');
    } else {
      console.log('\n⚠️  MIGRATION TEST ISSUES - Check individual test results');
    }

    // Save detailed report
    const reportPath = path.join(MIGRATION_CONFIG.TEST_DATA_DIR, 'migration-test-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return report;
  }

  async cleanup() {
    if (!MIGRATION_CONFIG.PRESERVE_ORIGINAL) {
      console.log('\n🧹 Cleaning up migration test data...');
      try {
        await fs.remove(MIGRATION_CONFIG.TEST_DATA_DIR);
        console.log('✅ Cleanup completed');
      } catch (error) {
        console.log('⚠️  Warning: Could not clean up test data:', error.message);
      }
    } else {
      console.log(`\n📁 Migration test data preserved at: ${MIGRATION_CONFIG.TEST_DATA_DIR}`);
    }
  }

  async run() {
    try {
      await this.initialize();
      const report = await this.generateMigrationReport();
      return report;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use in other tests
module.exports = { DataMigrationTest, MIGRATION_CONFIG };

// Run if called directly
if (require.main === module) {
  const migrationTest = new DataMigrationTest();
  
  migrationTest.run()
    .then(report => {
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration test failed:', error);
      process.exit(1);
    });
}