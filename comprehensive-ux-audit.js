// Comprehensive UX Audit Script for FitForge
// Tests all major user flows and functionality
// Reports all issues found during testing

const BASE_URL = 'http://172.22.206.209:5000';

// UX Issues Tracker
const issues = {
  critical: [],
  major: [],
  minor: [],
  working: []
};

function logIssue(severity, category, description, details = {}) {
  const issue = {
    category,
    description,
    details,
    timestamp: new Date().toISOString()
  };
  issues[severity].push(issue);
  console.log(`${severity.toUpperCase()}: [${category}] ${description}`);
  if (Object.keys(details).length > 0) {
    console.log('Details:', details);
  }
}

async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      logIssue('major', 'API', `API endpoint failed: ${endpoint}`, {
        status: response.status,
        error: data
      });
      return null;
    }
    
    logIssue('working', 'API', `API endpoint working: ${endpoint}`, {
      status: response.status
    });
    return data;
  } catch (error) {
    logIssue('critical', 'API', `API request failed: ${endpoint}`, {
      error: error.message
    });
    return null;
  }
}

async function runComprehensiveAudit() {
  console.log('🚀 Starting Comprehensive FitForge UX Audit');
  console.log('====================================================\n');

  // Test 1: Authentication & User Management
  console.log('1. Testing Authentication & User Management...');
  const authData = await testAPI('/api/auth/me');
  if (authData && authData.id) {
    logIssue('working', 'Auth', 'User authentication working', { user: authData.username });
  }

  const profileComplete = await testAPI('/api/users/profile-complete/1');
  if (profileComplete) {
    if (profileComplete.complete) {
      logIssue('working', 'Profile', 'User profile is complete');
    } else {
      logIssue('minor', 'Profile', 'User profile incomplete', { 
        missing: profileComplete.missingFields 
      });
    }
  }

  const bodyStats = await testAPI('/api/users/body-stats/1');
  if (bodyStats) {
    logIssue('working', 'BodyStats', 'Body stats API working');
  }

  // Test 2: Exercise Database
  console.log('\n2. Testing Exercise Database...');
  const exercises = await testAPI('/api/exercises');
  if (exercises && exercises.data && exercises.data.exercises) {
    const exerciseCount = exercises.data.exercises.length;
    if (exerciseCount > 0) {
      logIssue('working', 'Exercises', `Exercise database loaded with ${exerciseCount} exercises`);
      
      // Test exercise variety
      const workoutTypes = new Set();
      const muscleGroups = new Set();
      exercises.data.exercises.forEach(ex => {
        workoutTypes.add(ex.workoutType);
        ex.primaryMuscles?.forEach(m => muscleGroups.add(m.muscle));
      });
      
      logIssue('working', 'Exercises', `Exercise variety: ${workoutTypes.size} workout types, ${muscleGroups.size} muscle groups`);
    } else {
      logIssue('critical', 'Exercises', 'Exercise database is empty');
    }
  }

  // Test 3: Workout Session Management
  console.log('\n3. Testing Workout Session Management...');
  
  // Test starting a workout
  const startResult = await testAPI('/api/workouts/start', {
    method: 'POST',
    body: JSON.stringify({
      workoutType: 'Test',
      exercises: [
        { exerciseId: 'planks', exerciseName: 'Planks', muscleGroups: ['abs'] }
      ]
    })
  });

  if (startResult && startResult.sessionId) {
    logIssue('working', 'Workout', 'Workout session start working', {
      sessionId: startResult.sessionId
    });

    // Test logging a set
    const setResult = await testAPI('/api/workouts/log-set', {
      method: 'POST', 
      body: JSON.stringify({
        sessionId: startResult.sessionId,
        exerciseId: 'planks',
        exerciseName: 'Planks',
        setNumber: 1,
        weight: 0,
        reps: 10,
        formScore: 8
      })
    });

    if (setResult) {
      logIssue('working', 'Workout', 'Set logging working');
    }

    // Test completing workout
    const completeResult = await testAPI('/api/workouts/complete', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: startResult.sessionId,
        rating: 4,
        notes: 'Test workout completion'
      })
    });

    if (completeResult) {
      logIssue('working', 'Workout', 'Workout completion working');
    }
  }

  // Test 4: Workout History & Progress
  console.log('\n4. Testing Workout History & Progress...');
  const history = await testAPI('/api/workouts/history');
  if (history && history.workouts) {
    const workoutCount = history.workouts.length;
    if (workoutCount > 0) {
      logIssue('working', 'History', `Workout history contains ${workoutCount} workouts`);
      
      // Check for data completeness
      const completeWorkouts = history.workouts.filter(w => w.sessionType === 'completed');
      const abandonedWorkouts = history.workouts.filter(w => w.sessionType === 'abandoned');
      
      logIssue('working', 'History', `Workout breakdown: ${completeWorkouts.length} completed, ${abandonedWorkouts.length} abandoned`);
    } else {
      logIssue('minor', 'History', 'No workout history found');
    }
  }

  // Test 5: Goal System
  console.log('\n5. Testing Goal System...');
  const goals = await testAPI('/api/goals');
  if (goals) {
    logIssue('working', 'Goals', 'Goals API endpoint accessible');
  }

  // Test 6: Progress Analytics
  console.log('\n6. Testing Progress Analytics...');
  const progressData = await testAPI('/api/progress/analytics');
  if (progressData) {
    logIssue('working', 'Progress', 'Progress analytics API working');
  }

  // Test 7: Muscle Recovery System
  console.log('\n7. Testing Muscle Recovery System...');
  const recoveryData = await testAPI('/api/workouts/muscle-recovery');
  if (recoveryData) {
    logIssue('working', 'Recovery', 'Muscle recovery API working');
  }

  // Test 8: Data Consistency & Validation
  console.log('\n8. Testing Data Consistency...');
  
  // Check for data type consistency
  if (exercises && exercises.data && exercises.data.exercises.length > 0) {
    const exercise = exercises.data.exercises[0];
    if (typeof exercise.id === 'string') {
      logIssue('working', 'DataTypes', 'Exercise IDs are strings (consistent with schema)');
    } else {
      logIssue('major', 'DataTypes', 'Exercise ID type inconsistency', {
        expected: 'string',
        actual: typeof exercise.id,
        value: exercise.id
      });
    }
  }

  // Test 9: Error Handling
  console.log('\n9. Testing Error Handling...');
  const invalidEndpoint = await testAPI('/api/invalid-endpoint');
  if (!invalidEndpoint) {
    logIssue('working', 'ErrorHandling', 'Invalid endpoints properly handled');
  }

  // Test 10: Performance Checks
  console.log('\n10. Testing Performance...');
  const perfStart = performance.now();
  await testAPI('/api/exercises');
  const perfEnd = performance.now();
  const responseTime = perfEnd - perfStart;
  
  if (responseTime < 1000) {
    logIssue('working', 'Performance', `Exercise API response time: ${responseTime.toFixed(2)}ms`);
  } else {
    logIssue('minor', 'Performance', `Slow API response: ${responseTime.toFixed(2)}ms`);
  }

  // Generate Final Report
  console.log('\n\n📊 COMPREHENSIVE UX AUDIT RESULTS');
  console.log('====================================================');
  console.log(`✅ Working Features: ${issues.working.length}`);
  console.log(`⚠️  Minor Issues: ${issues.minor.length}`);
  console.log(`🔶 Major Issues: ${issues.major.length}`);
  console.log(`🚨 Critical Issues: ${issues.critical.length}`);

  if (issues.critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (Fix Immediately):');
    issues.critical.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.category}] ${issue.description}`);
      if (Object.keys(issue.details).length > 0) {
        console.log(`     Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    });
  }

  if (issues.major.length > 0) {
    console.log('\n🔶 MAJOR ISSUES (High Priority):');
    issues.major.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.category}] ${issue.description}`);
      if (Object.keys(issue.details).length > 0) {
        console.log(`     Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    });
  }

  if (issues.minor.length > 0) {
    console.log('\n⚠️  MINOR ISSUES (Medium Priority):');
    issues.minor.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.category}] ${issue.description}`);
      if (Object.keys(issue.details).length > 0) {
        console.log(`     Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    });
  }

  console.log('\n✅ WORKING FEATURES:');
  const categoryStats = {};
  issues.working.forEach(issue => {
    categoryStats[issue.category] = (categoryStats[issue.category] || 0) + 1;
  });
  
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} features working`);
  });

  return issues;
}

// Run the audit
runComprehensiveAudit().catch(console.error);