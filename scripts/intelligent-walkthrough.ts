#!/usr/bin/env tsx

/**
 * Intelligent Change Walkthrough System
 * 
 * This script automatically:
 * 1. Detects what files Claude changed since last session
 * 2. Analyzes the nature of changes (UI, API, features, fixes)
 * 3. Creates an interactive browser walkthrough 
 * 4. Guides user through testing each change systematically
 * 
 * Usage: npm run walkthrough
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Change {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  category: 'frontend' | 'backend' | 'config' | 'docs' | 'test';
  impact: 'critical' | 'major' | 'minor';
  description: string;
  testSteps: string[];
  browserPath?: string; // URL path to test this change
}

interface WalkthroughSession {
  sessionId: string;
  timestamp: string;
  totalChanges: number;
  changes: Change[];
  testingPlan: TestStep[];
}

interface TestStep {
  id: string;
  title: string;
  description: string;
  action: 'navigate' | 'click' | 'type' | 'verify' | 'screenshot';
  target?: string;
  expectedResult: string;
  relatedChanges: string[]; // file paths
}

class IntelligentWalkthrough {
  private projectRoot: string;
  private wsIP: string;
  private port: number;

  constructor() {
    this.projectRoot = process.cwd();
    this.wsIP = this.getWSLIP();
    this.port = 5000; // FitForge default port
  }

  /**
   * Get WSL IP address for browser access
   */
  private getWSLIP(): string {
    try {
      const ip = execSync(`ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1`).toString().trim();
      return ip;
    } catch (error) {
      console.warn('Could not detect WSL IP, using localhost');
      return 'localhost';
    }
  }

  /**
   * Detect changes since last commit or session
   */
  async detectChanges(): Promise<Change[]> {
    console.log('🔍 Detecting changes...');
    
    const changes: Change[] = [];
    
    try {
      // Get git status for modified files
      const gitStatus = execSync('git status --porcelain').toString();
      const gitLines = gitStatus.split('\n').filter(line => line.trim());
      
      for (const line of gitLines) {
        const status = line.substring(0, 2);
        const filePath = line.substring(3);
        
        if (this.shouldAnalyzeFile(filePath)) {
          const change = await this.analyzeChange(filePath, status);
          if (change) changes.push(change);
        }
      }
      
      // Also check recent commits for context
      try {
        const recentCommits = execSync('git log --oneline -10').toString();
        console.log('📝 Recent commits for context:\n', recentCommits);
      } catch (e) {
        // No commits yet
      }
      
    } catch (error) {
      console.log('📂 Git not available, checking file timestamps...');
      // Fallback: check recently modified files
      changes.push(...await this.detectRecentFileChanges());
    }
    
    return changes;
  }

  /**
   * Check if file should be analyzed for changes
   */
  private shouldAnalyzeFile(filePath: string): boolean {
    if (filePath.includes('node_modules') || filePath.includes('.git')) return false;
    if (filePath.endsWith('.log') || filePath.endsWith('.tmp')) return false;
    if (filePath.includes('intelligent-walkthrough')) return false; // Don't analyze self
    
    return true;
  }

  /**
   * Analyze a specific change and categorize it
   */
  private async analyzeChange(filePath: string, status: string): Promise<Change | null> {
    const fullPath = path.join(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath) && !status.includes('D')) {
      return null;
    }
    
    const change: Change = {
      file: filePath,
      type: status.includes('A') ? 'added' : status.includes('D') ? 'deleted' : 'modified',
      category: this.categorizeFile(filePath),
      impact: 'minor',
      description: '',
      testSteps: []
    };
    
    // Analyze file content for impact and description
    if (change.type !== 'deleted') {
      await this.analyzeFileContent(change, fullPath);
    }
    
    return change;
  }

  /**
   * Categorize file by its path and purpose
   */
  private categorizeFile(filePath: string): Change['category'] {
    if (filePath.includes('client/src/')) return 'frontend';
    if (filePath.includes('server/')) return 'backend';
    if (filePath.includes('test') || filePath.includes('.test.') || filePath.includes('.spec.')) return 'test';
    if (filePath.includes('README') || filePath.endsWith('.md')) return 'docs';
    if (filePath.includes('package.json') || filePath.includes('tsconfig') || filePath.includes('vite.config')) return 'config';
    
    return 'frontend'; // Default assumption for FitForge
  }

  /**
   * Analyze file content to understand the change impact
   */
  private async analyzeFileContent(change: Change, fullPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Frontend component analysis
      if (change.category === 'frontend' && fullPath.includes('.tsx')) {
        this.analyzeFrontendComponent(change, content);
      }
      
      // Backend API analysis
      if (change.category === 'backend' && fullPath.includes('.ts')) {
        this.analyzeBackendAPI(change, content);
      }
      
      // Configuration analysis
      if (change.category === 'config') {
        this.analyzeConfigChange(change, content);
      }
      
    } catch (error) {
      console.warn(`Could not analyze ${fullPath}:`, error);
    }
  }

  /**
   * Analyze frontend component changes
   */
  private analyzeFrontendComponent(change: Change, content: string): void {
    const hasNewComponent = content.includes('export default function') || content.includes('export const');
    const hasFormHandling = content.includes('onSubmit') || content.includes('handleSubmit');
    const hasNavigation = content.includes('navigate') || content.includes('href');
    const hasStateManagement = content.includes('useState') || content.includes('useEffect');
    const hasUIComponents = content.includes('Button') || content.includes('Card') || content.includes('Dialog');
    
    if (hasNewComponent) {
      change.impact = 'major';
      change.description = 'New React component created';
      change.testSteps.push('Verify component renders correctly');
      change.testSteps.push('Test responsive design on mobile and desktop');
    }
    
    if (hasFormHandling) {
      change.impact = 'critical';
      change.description += (change.description ? ' with ' : '') + 'form handling';
      change.testSteps.push('Test form validation');
      change.testSteps.push('Test form submission');
      change.testSteps.push('Test error handling');
    }
    
    if (hasNavigation) {
      change.testSteps.push('Test navigation links work correctly');
      change.browserPath = this.extractBrowserPath(change.file);
    }
    
    if (hasUIComponents) {
      change.testSteps.push('Test button interactions');
      change.testSteps.push('Test modal/dialog functionality');
      change.testSteps.push('Verify consistent styling');
    }
  }

  /**
   * Analyze backend API changes
   */
  private analyzeBackendAPI(change: Change, content: string): void {
    const hasNewRoute = content.includes('router.') || content.includes('app.');
    const hasDatabase = content.includes('supabase') || content.includes('db.');
    const hasAuth = content.includes('auth') || content.includes('token');
    
    if (hasNewRoute) {
      change.impact = 'major';
      change.description = 'New API endpoint';
      change.testSteps.push('Test API endpoint returns expected data');
      change.testSteps.push('Test error handling for invalid requests');
    }
    
    if (hasDatabase) {
      change.impact = 'critical';
      change.description += (change.description ? ' with ' : '') + 'database integration';
      change.testSteps.push('Verify data persistence');
      change.testSteps.push('Test data validation');
    }
  }

  /**
   * Analyze configuration changes
   */
  private analyzeConfigChange(change: Change, content: string): void {
    change.impact = 'major';
    change.description = 'Configuration update';
    change.testSteps.push('Verify application starts correctly');
    change.testSteps.push('Check for any console errors');
  }

  /**
   * Extract browser path from file path
   */
  private extractBrowserPath(filePath: string): string {
    if (filePath.includes('pages/')) {
      const pageName = path.basename(filePath, '.tsx');
      return `/${pageName}`;
    }
    if (filePath.includes('dashboard')) return '/dashboard';
    if (filePath.includes('workout')) return '/workouts';
    if (filePath.includes('progress')) return '/progress';
    if (filePath.includes('profile')) return '/profile';
    
    return '/'; // Default to home
  }

  /**
   * Create comprehensive testing plan
   */
  async createTestingPlan(changes: Change[]): Promise<TestStep[]> {
    const testSteps: TestStep[] = [];
    
    // Start with basic connectivity test
    testSteps.push({
      id: 'connectivity',
      title: 'Verify Application Accessibility',
      description: `Test that FitForge loads at http://${this.wsIP}:${this.port}`,
      action: 'navigate',
      target: `http://${this.wsIP}:${this.port}`,
      expectedResult: 'Application loads without errors, shows main interface',
      relatedChanges: []
    });
    
    // Group changes by category and create focused tests
    const frontendChanges = changes.filter(c => c.category === 'frontend');
    const backendChanges = changes.filter(c => c.category === 'backend');
    
    // Frontend testing steps
    for (const change of frontendChanges) {
      if (change.browserPath) {
        testSteps.push({
          id: `frontend_${testSteps.length}`,
          title: `Test ${path.basename(change.file, '.tsx')} Component`,
          description: `Navigate to and test the updated component: ${change.description}`,
          action: 'navigate',
          target: `http://${this.wsIP}:${this.port}${change.browserPath}`,
          expectedResult: 'Component loads and functions as expected',
          relatedChanges: [change.file]
        });
      }
      
      // Add specific test steps from change analysis
      change.testSteps.forEach((step, idx) => {
        testSteps.push({
          id: `test_${change.file}_${idx}`,
          title: step,
          description: `Test: ${step} for ${change.file}`,
          action: 'verify',
          expectedResult: 'Feature works as intended',
          relatedChanges: [change.file]
        });
      });
    }
    
    // Backend API testing
    for (const change of backendChanges) {
      testSteps.push({
        id: `backend_${testSteps.length}`,
        title: `Verify ${path.basename(change.file)} API`,
        description: `Test backend functionality: ${change.description}`,
        action: 'verify',
        expectedResult: 'API responds correctly, data flows properly',
        relatedChanges: [change.file]
      });
    }
    
    return testSteps;
  }

  /**
   * Generate comprehensive walkthrough report
   */
  async generateWalkthroughReport(session: WalkthroughSession): Promise<string> {
    const reportPath = path.join(this.projectRoot, 'WALKTHROUGH_REPORT.md');
    
    const report = `# 🚀 Intelligent Change Walkthrough Report

Generated: ${new Date().toISOString()}
Session ID: ${session.sessionId}
Total Changes: ${session.totalChanges}

## 📋 Quick Summary

${session.changes.length === 0 ? '✅ No significant changes detected since last session.' : `
🔧 **${session.changes.filter(c => c.impact === 'critical').length} Critical Changes**
⚡ **${session.changes.filter(c => c.impact === 'major').length} Major Changes** 
🔍 **${session.changes.filter(c => c.impact === 'minor').length} Minor Changes**

### Critical Changes (Require Immediate Testing):
${session.changes.filter(c => c.impact === 'critical').map(c => 
  `- **${c.file}**: ${c.description}`
).join('\n') || 'None'}

### Major Changes (Should Be Tested):
${session.changes.filter(c => c.impact === 'major').map(c => 
  `- **${c.file}**: ${c.description}`
).join('\n') || 'None'}
`}

## 🌐 Testing Access Point

**Primary URL**: http://${this.wsIP}:${this.port}
**Backup URL**: http://localhost:${this.port} (if WSL networking works)

## 🧪 Guided Testing Plan

${session.testingPlan.map((step, idx) => `
### ${idx + 1}. ${step.title}

**What to do**: ${step.description}
**Expected result**: ${step.expectedResult}
${step.target ? `**URL**: ${step.target}` : ''}
${step.relatedChanges.length > 0 ? `**Related files**: ${step.relatedChanges.join(', ')}` : ''}

---
`).join('')}

## 📁 Detailed Change Analysis

${session.changes.map(change => `
### ${change.file}
- **Type**: ${change.type}
- **Category**: ${change.category}
- **Impact**: ${change.impact}
- **Description**: ${change.description}
${change.testSteps.length > 0 ? `
**Recommended Tests**:
${change.testSteps.map(step => `- ${step}`).join('\n')}
` : ''}
`).join('')}

## 🎯 Quick Testing Checklist

${session.testingPlan.map((step, idx) => 
  `- [ ] ${step.title}`
).join('\n')}

---

*This report was automatically generated by the Intelligent Walkthrough System*
*Run \`npm run walkthrough\` to regenerate*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📋 Walkthrough report saved to: ${reportPath}`);
    
    return reportPath;
  }

  /**
   * Fallback: detect recent file changes by timestamp
   */
  private async detectRecentFileChanges(): Promise<Change[]> {
    const changes: Change[] = [];
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000); // 1 hour ago
    
    const checkDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
            checkDirectory(fullPath);
          } else if (stat.mtime.getTime() > hourAgo && this.shouldAnalyzeFile(item)) {
            const relativePath = path.relative(this.projectRoot, fullPath);
            changes.push({
              file: relativePath,
              type: 'modified',
              category: this.categorizeFile(relativePath),
              impact: 'minor',
              description: 'Recently modified file',
              testSteps: ['Verify file changes work correctly']
            });
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    checkDirectory(this.projectRoot);
    return changes.slice(0, 20); // Limit to most recent 20 changes
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log('🎯 Starting Intelligent Change Walkthrough...\n');
    
    // Detect changes
    const changes = await this.detectChanges();
    console.log(`📊 Detected ${changes.length} changes\n`);
    
    if (changes.length === 0) {
      console.log('✅ No significant changes detected since last session.');
      console.log(`🌐 Application should be running at: http://${this.wsIP}:${this.port}`);
      return;
    }
    
    // Create testing plan
    const testingPlan = await this.createTestingPlan(changes);
    
    // Create session
    const session: WalkthroughSession = {
      sessionId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      totalChanges: changes.length,
      changes,
      testingPlan
    };
    
    // Generate report
    const reportPath = await this.generateWalkthroughReport(session);
    
    // Display summary
    console.log('🎉 Walkthrough Analysis Complete!\n');
    console.log(`📋 Full report saved to: ${reportPath}`);
    console.log(`🌐 Test your changes at: http://${this.wsIP}:${this.port}\n`);
    
    console.log('🚀 Quick Summary:');
    console.log(`   • ${changes.filter(c => c.impact === 'critical').length} Critical changes`);
    console.log(`   • ${changes.filter(c => c.impact === 'major').length} Major changes`);
    console.log(`   • ${changes.filter(c => c.impact === 'minor').length} Minor changes`);
    console.log(`   • ${testingPlan.length} testing steps recommended\n`);
    
    // Show critical changes immediately
    const criticalChanges = changes.filter(c => c.impact === 'critical');
    if (criticalChanges.length > 0) {
      console.log('⚠️ CRITICAL CHANGES - Test these first:');
      criticalChanges.forEach(change => {
        console.log(`   🔴 ${change.file}: ${change.description}`);
      });
      console.log('');
    }
    
    console.log('📖 Next steps:');
    console.log('   1. Open the walkthrough report in your editor');
    console.log('   2. Visit the application URL to start testing');
    console.log('   3. Follow the guided testing plan step by step');
    console.log('   4. Check off items as you verify they work\n');
  }
}

// Run the walkthrough if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const walkthrough = new IntelligentWalkthrough();
  walkthrough.run().catch(console.error);
}

export { IntelligentWalkthrough, type Change, type TestStep, type WalkthroughSession };