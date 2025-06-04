#!/usr/bin/env node

/**
 * Enhanced Context Resolver for Task-Master
 * Makes /task command context-independent by reading from multiple sources
 * 
 * Usage: node enhanced-context-resolver.js
 * Returns: Comprehensive context for current branch and session
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnhancedContextResolver {
  constructor() {
    this.projectRoot = process.cwd();
    this.taskmasterDir = path.join(this.projectRoot, '.taskmaster');
    this.branchMappingFile = path.join(this.taskmasterDir, 'branch-task-mapping.json');
    this.sessionStateFile = path.join(this.projectRoot, 'session_state.json');
  }

  /**
   * Get current git branch
   */
  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error('Warning: Could not determine git branch');
      return 'master';
    }
  }

  /**
   * Load branch-task mapping configuration
   */
  loadBranchMapping() {
    try {
      if (fs.existsSync(this.branchMappingFile)) {
        return JSON.parse(fs.readFileSync(this.branchMappingFile, 'utf8'));
      }
    } catch (error) {
      console.error('Warning: Could not load branch mapping');
    }
    
    // Return default mapping
    return {
      branches: {
        master: {
          taskFile: 'tasks.json',
          description: 'Main development branch'
        }
      },
      defaultBranch: 'master',
      taskFileLocation: '.taskmaster/tasks/',
      sessionStateFile: 'session_state.json'
    };
  }

  /**
   * Load session state
   */
  loadSessionState() {
    try {
      if (fs.existsSync(this.sessionStateFile)) {
        return JSON.parse(fs.readFileSync(this.sessionStateFile, 'utf8'));
      }
    } catch (error) {
      console.error('Warning: Could not load session state');
    }
    
    return {
      currentTask: null,
      lastActivity: null,
      branchContext: null
    };
  }

  /**
   * Load branch-specific task file
   */
  loadBranchTasks(branch, mapping) {
    const branchConfig = mapping.branches[branch] || mapping.branches[mapping.defaultBranch];
    const taskFile = path.join(this.projectRoot, mapping.taskFileLocation, branchConfig.taskFile);
    
    try {
      if (fs.existsSync(taskFile)) {
        const taskData = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
        return taskData;
      }
    } catch (error) {
      console.error(`Warning: Could not load task file: ${taskFile}`, error.message);
    }
    
    return { tasks: [] };
  }

  /**
   * Find next task based on dependencies and status
   */
  findNextTask(tasks) {
    // Find pending tasks without incomplete dependencies
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    
    for (const task of pendingTasks) {
      const dependencies = task.dependencies || [];
      const allDepsComplete = dependencies.every(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });
      
      if (allDepsComplete) {
        return task;
      }
    }
    
    // If no tasks with satisfied dependencies, return first pending
    return pendingTasks[0] || null;
  }

  /**
   * Generate comprehensive context report
   */
  resolveContext() {
    const currentBranch = this.getCurrentBranch();
    const branchMapping = this.loadBranchMapping();
    const sessionState = this.loadSessionState();
    const branchTasks = this.loadBranchTasks(currentBranch, branchMapping);
    
    const branchConfig = branchMapping.branches[currentBranch] || branchMapping.branches[branchMapping.defaultBranch];
    const nextTask = this.findNextTask(branchTasks.tasks || []);
    
    // Calculate progress statistics
    const allTasks = branchTasks.tasks || [];
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
    const pendingTasks = allTasks.filter(t => t.status === 'pending');
    
    const progressPercentage = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    const context = {
      timestamp: new Date().toISOString(),
      project: {
        root: this.projectRoot,
        name: path.basename(this.projectRoot)
      },
      git: {
        currentBranch,
        branchDescription: branchConfig.description,
        githubIssue: branchConfig.githubIssue,
        objective: branchConfig.objective
      },
      progress: {
        totalTasks: allTasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        pending: pendingTasks.length,
        percentage: progressPercentage
      },
      currentSession: {
        activeTask: sessionState.currentTask,
        lastActivity: sessionState.lastActivity,
        branchContext: sessionState.branchContext
      },
      nextRecommendedTask: nextTask,
      taskSummary: {
        completed: completedTasks.map(t => ({ id: t.id, title: t.title })),
        current: inProgressTasks.map(t => ({ id: t.id, title: t.title })),
        upcoming: pendingTasks.slice(0, 3).map(t => ({ id: t.id, title: t.title }))
      }
    };

    return context;
  }

  /**
   * Generate human-readable context summary
   */
  generateSummary() {
    const context = this.resolveContext();
    
    let summary = `\n=== FitForge Task Context (${context.timestamp}) ===\n\n`;
    
    // Branch and objective
    summary += `📍 Current Branch: ${context.git.currentBranch}\n`;
    summary += `🎯 Objective: ${context.git.objective || 'General development'}\n`;
    if (context.git.githubIssue) {
      summary += `🐛 GitHub Issue: #${context.git.githubIssue}\n`;
    }
    
    // Progress overview
    summary += `\n📊 Progress: ${context.progress.completed}/${context.progress.totalTasks} tasks (${context.progress.percentage}%)\n`;
    summary += `   ✅ Completed: ${context.progress.completed}\n`;
    summary += `   🔄 In Progress: ${context.progress.inProgress}\n`;
    summary += `   ⏳ Pending: ${context.progress.pending}\n`;
    
    // Current work
    if (context.currentSession.activeTask) {
      summary += `\n🔄 Current Task: ${context.currentSession.activeTask}\n`;
    }
    
    // Next recommended task
    if (context.nextRecommendedTask) {
      summary += `\n➡️  Next Task: ${context.nextRecommendedTask.title}\n`;
      summary += `   ID: ${context.nextRecommendedTask.id}\n`;
      if (context.nextRecommendedTask.description) {
        summary += `   Description: ${context.nextRecommendedTask.description}\n`;
      }
    }
    
    // Recent completed work
    if (context.taskSummary.completed.length > 0) {
      summary += `\n✅ Recently Completed:\n`;
      context.taskSummary.completed.slice(-3).forEach(task => {
        summary += `   - ${task.title} (${task.id})\n`;
      });
    }
    
    // Upcoming work preview
    if (context.taskSummary.upcoming.length > 0) {
      summary += `\n⏳ Upcoming Tasks:\n`;
      context.taskSummary.upcoming.forEach(task => {
        summary += `   - ${task.title} (${task.id})\n`;
      });
    }
    
    summary += `\n=== End Context ===\n`;
    
    return summary;
  }
}

// CLI execution
if (require.main === module) {
  const resolver = new EnhancedContextResolver();
  
  const args = process.argv.slice(2);
  const outputFormat = args.includes('--json') ? 'json' : 'summary';
  
  try {
    if (outputFormat === 'json') {
      console.log(JSON.stringify(resolver.resolveContext(), null, 2));
    } else {
      console.log(resolver.generateSummary());
    }
  } catch (error) {
    console.error('Error resolving context:', error.message);
    process.exit(1);
  }
}

module.exports = EnhancedContextResolver;