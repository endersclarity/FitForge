#!/usr/bin/env node

/**
 * Comprehensive Performance Test Runner for Unified Storage System
 * 
 * Executes all performance tests in sequence and generates a combined
 * report to validate the unified storage system meets requirements.
 */

const { PerformanceTestSuite } = require('./performance-test-unified-storage');
const { ConcurrentStressTest } = require('./stress-test-concurrent');
const { DataMigrationTest } = require('./test-data-migration');
const fs = require('fs-extra');
const path = require('path');

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      performance: null,
      stress: null,
      migration: null,
      summary: {},
      startTime: Date.now()
    };
    this.reportDir = './data/test-reports';
  }

  async initialize() {
    console.log('🚀 FITFORGE UNIFIED STORAGE PERFORMANCE TEST SUITE');
    console.log('='.repeat(60));
    console.log('');
    console.log('This comprehensive test suite validates:');
    console.log('• Single user performance and data integrity');
    console.log('• Multi-user concurrent operations');
    console.log('• Data isolation between users');
    console.log('• Large data load handling');
    console.log('• File system stress testing');
    console.log('• Legacy data migration accuracy');
    console.log('• Progressive overload calculations');
    console.log('');

    await fs.ensureDir(this.reportDir);
  }

  async runPerformanceTests() {
    console.log('🏃‍♂️ PHASE 1: PERFORMANCE TESTING');
    console.log('='.repeat(40));
    
    try {
      const perfSuite = new PerformanceTestSuite();
      this.results.performance = await perfSuite.runAllTests();
      console.log('✅ Performance tests completed successfully\n');
      return true;
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      this.results.performance = { error: error.message };
      return false;
    }
  }

  async runConcurrentStressTests() {
    console.log('⚡ PHASE 2: CONCURRENT STRESS TESTING');
    console.log('='.repeat(40));
    
    try {
      const stressTest = new ConcurrentStressTest();
      this.results.stress = await stressTest.run();
      console.log('✅ Stress tests completed successfully\n');
      return true;
    } catch (error) {
      console.error('❌ Stress tests failed:', error.message);
      this.results.stress = { error: error.message };
      return false;
    }
  }

  async runMigrationTests() {
    console.log('🔄 PHASE 3: DATA MIGRATION TESTING');
    console.log('='.repeat(40));
    
    try {
      const migrationTest = new DataMigrationTest();
      this.results.migration = await migrationTest.run();
      console.log('✅ Migration tests completed successfully\n');
      return true;
    } catch (error) {
      console.error('❌ Migration tests failed:', error.message);
      this.results.migration = { error: error.message };
      return false;
    }
  }

  analyzeResults() {
    console.log('📊 COMPREHENSIVE TEST ANALYSIS');
    console.log('='.repeat(40));

    const analysis = {
      performance: this.analyzePerformanceResults(),
      stress: this.analyzeStressResults(),
      migration: this.analyzeMigrationResults(),
      overall: {}
    };

    // Overall system assessment
    analysis.overall = {
      performancePassed: analysis.performance.passed,
      stressPassed: analysis.stress.passed,
      migrationPassed: analysis.migration.passed,
      systemReady: analysis.performance.passed && analysis.stress.passed && analysis.migration.passed,
      criticalIssues: [],
      recommendations: []
    };

    // Collect critical issues
    if (!analysis.performance.passed) {
      analysis.overall.criticalIssues.push('Performance benchmarks not met');
    }
    if (!analysis.stress.passed) {
      analysis.overall.criticalIssues.push('Concurrent stress testing failed');
    }
    if (!analysis.migration.passed) {
      analysis.overall.criticalIssues.push('Data migration has integrity issues');
    }

    // Generate recommendations
    if (analysis.performance.avgOperationTime > 300) {
      analysis.overall.recommendations.push('Optimize file I/O operations - average time is high');
    }
    if (analysis.stress.dataConsistencyIssues > 0) {
      analysis.overall.recommendations.push('Address data consistency issues in concurrent operations');
    }
    if (!analysis.migration.progressiveOverloadWorking) {
      analysis.overall.recommendations.push('Fix progressive overload calculations after migration');
    }
    if (analysis.performance.errorRate > 5) {
      analysis.overall.recommendations.push('Investigate and fix error handling - error rate too high');
    }

    if (analysis.overall.systemReady) {
      analysis.overall.recommendations.push('System performance is excellent - ready for production use');
    }

    return analysis;
  }

  analyzePerformanceResults() {
    if (!this.results.performance || this.results.performance.error) {
      return { passed: false, error: this.results.performance?.error || 'No results' };
    }

    const perf = this.results.performance;
    const avgTime = perf.summary?.averageOperationTime || 0;
    const errorRate = perf.summary?.errorCount ? 
      (perf.summary.errorCount / perf.summary.totalWorkouts) * 100 : 0;

    return {
      passed: avgTime < 500 && errorRate < 10 && perf.summary?.successRate > 90,
      avgOperationTime: avgTime,
      errorRate: errorRate,
      successRate: perf.summary?.successRate || 0,
      totalOperations: perf.summary?.totalWorkouts || 0
    };
  }

  analyzeStressResults() {
    if (!this.results.stress || this.results.stress.error) {
      return { passed: false, error: this.results.stress?.error || 'No results' };
    }

    const stress = this.results.stress;
    const successRate = stress.summary?.successRate || 0;
    const dataIssues = stress.dataConsistency?.issuesFound || 0;
    const fileSystemPassed = stress.fileSystemStress?.dataIntegrityPassed || false;

    return {
      passed: successRate >= 95 && dataIssues === 0 && fileSystemPassed,
      successRate: successRate,
      dataConsistencyIssues: dataIssues,
      fileSystemPassed: fileSystemPassed,
      operationsPerSecond: stress.performance?.operationsPerSecond || 0
    };
  }

  analyzeMigrationResults() {
    if (!this.results.migration || this.results.migration.error) {
      return { passed: false, error: this.results.migration?.error || 'No results' };
    }

    const migration = this.results.migration;
    const migrationSuccessful = migration.overall?.migrationSuccessful || false;
    const dataIntegrityPassed = migration.overall?.dataIntegrityPassed || false;
    const progressiveOverloadWorking = migration.overall?.progressiveOverloadWorking || false;

    return {
      passed: migrationSuccessful && dataIntegrityPassed && progressiveOverloadWorking,
      migrationSuccessful: migrationSuccessful,
      dataIntegrityPassed: dataIntegrityPassed,
      progressiveOverloadWorking: progressiveOverloadWorking,
      sessionsMigrated: (migration.migration?.legacySessionsMigrated || 0) + (migration.migration?.workoutLogsMigrated || 0)
    };
  }

  generateFinalReport(analysis) {
    console.log('\n📋 FINAL TEST REPORT');
    console.log('='.repeat(50));

    const totalTime = Date.now() - this.results.startTime;

    console.log(`⏱️  Total Test Duration: ${Math.round(totalTime / 1000)}s`);
    console.log('');

    // Performance Summary
    console.log('🏃‍♂️ PERFORMANCE RESULTS:');
    if (analysis.performance.passed) {
      console.log(`   ✅ PASSED - Avg Operation Time: ${analysis.performance.avgOperationTime}ms`);
      console.log(`   ✅ Success Rate: ${analysis.performance.successRate.toFixed(2)}%`);
      console.log(`   ✅ Error Rate: ${analysis.performance.errorRate.toFixed(2)}%`);
    } else {
      console.log(`   ❌ FAILED - ${analysis.performance.error || 'Performance benchmarks not met'}`);
    }
    console.log('');

    // Stress Test Summary
    console.log('⚡ STRESS TEST RESULTS:');
    if (analysis.stress.passed) {
      console.log(`   ✅ PASSED - Success Rate: ${analysis.stress.successRate.toFixed(2)}%`);
      console.log(`   ✅ Data Consistency: ${analysis.stress.dataConsistencyIssues} issues`);
      console.log(`   ✅ File System: ${analysis.stress.fileSystemPassed ? 'Passed' : 'Failed'}`);
      console.log(`   ⚡ Operations/sec: ${analysis.stress.operationsPerSecond.toFixed(2)}`);
    } else {
      console.log(`   ❌ FAILED - ${analysis.stress.error || 'Stress testing failed'}`);
    }
    console.log('');

    // Migration Summary
    console.log('🔄 MIGRATION RESULTS:');
    if (analysis.migration.passed) {
      console.log(`   ✅ PASSED - Migration: ${analysis.migration.migrationSuccessful ? 'Success' : 'Failed'}`);
      console.log(`   ✅ Data Integrity: ${analysis.migration.dataIntegrityPassed ? 'Passed' : 'Failed'}`);
      console.log(`   ✅ Progressive Overload: ${analysis.migration.progressiveOverloadWorking ? 'Working' : 'Not Working'}`);
      console.log(`   📊 Sessions Migrated: ${analysis.migration.sessionsMigrated}`);
    } else {
      console.log(`   ❌ FAILED - ${analysis.migration.error || 'Migration testing failed'}`);
    }
    console.log('');

    // Overall Assessment
    console.log('🎯 OVERALL ASSESSMENT:');
    if (analysis.overall.systemReady) {
      console.log('   🎉 SYSTEM READY FOR PRODUCTION');
      console.log('   ✅ All performance benchmarks met');
      console.log('   ✅ Concurrent operations working correctly');
      console.log('   ✅ Data migration working properly');
      console.log('   ✅ No critical issues detected');
    } else {
      console.log('   ⚠️  SYSTEM NEEDS ATTENTION');
      console.log('   ❌ Critical issues detected:');
      analysis.overall.criticalIssues.forEach(issue => {
        console.log(`      • ${issue}`);
      });
    }
    console.log('');

    // Recommendations
    if (analysis.overall.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      analysis.overall.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
      console.log('');
    }

    // Generate comprehensive report file
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: totalTime,
      results: this.results,
      analysis: analysis
    };

    const reportPath = path.join(this.reportDir, `comprehensive-test-report-${Date.now()}.json`);
    fs.writeJSONSync(reportPath, report, { spaces: 2 });

    console.log(`📄 Complete report saved to: ${reportPath}`);

    return analysis.overall.systemReady;
  }

  async run() {
    try {
      await this.initialize();

      // Run all test phases
      const perfPassed = await this.runPerformanceTests();
      const stressPassed = await this.runConcurrentStressTests();
      const migrationPassed = await this.runMigrationTests();

      // Analyze and report results
      const analysis = this.analyzeResults();
      const systemReady = this.generateFinalReport(analysis);

      return {
        systemReady,
        results: this.results,
        analysis
      };

    } catch (error) {
      console.error('💥 Comprehensive test runner failed:', error);
      throw error;
    }
  }
}

// Export for programmatic use
module.exports = { ComprehensiveTestRunner };

// Run if called directly
if (require.main === module) {
  const testRunner = new ComprehensiveTestRunner();
  
  testRunner.run()
    .then(result => {
      if (result.systemReady) {
        console.log('\n🎉 ALL TESTS PASSED - Unified Storage System is ready for production!');
        process.exit(0);
      } else {
        console.log('\n⚠️  TESTS REVEALED ISSUES - Review results and fix before deployment');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test runner failed:', error);
      process.exit(1);
    });
}