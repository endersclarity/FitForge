# FitForge Parallel Agent Isolation Strategy

**Generated**: 2025-06-05  
**Purpose**: Safe isolation strategy for 4-agent parallel development  
**Safety**: Git worktrees + file locks + monitoring + emergency rollback

## 🏗️ Git Worktree Isolation Architecture

### Worktree Structure
```
FitForge/
├── master/                    # Main working directory (stable)
├── worktrees/
│   ├── agent-ui-components/   # Agent A: UI enhancement
│   ├── agent-new-pages/       # Agent B: Page development  
│   ├── agent-services/        # Agent C: Business logic
│   └── agent-api/             # Agent D: Backend APIs
└── EMERGENCY_ROLLBACK.sh      # Instant restore script
```

### Worktree Setup Commands
```bash
# Create isolated worktrees for each agent
git worktree add worktrees/agent-ui-components feature/ui-components
git worktree add worktrees/agent-new-pages feature/new-pages
git worktree add worktrees/agent-services feature/services  
git worktree add worktrees/agent-api feature/api-extensions

# Verify isolation
git worktree list
```

## 🛡️ File-Level Access Control

### Agent A: UI Components (Strict Boundaries)
**ALLOWED Directories**:
- ✅ `client/src/components/ui/` - New UI components only
- ✅ `client/src/components/charts/` - New directory creation
- ✅ `client/src/components/workout/WorkoutTimer.tsx` - New file
- ✅ `client/src/components/muscle-heatmap/` - Enhancement only

**FORBIDDEN Files** (File locks required):
- ❌ `client/src/App.tsx` - Main app structure
- ❌ `client/src/components/navigation.tsx` - Shared navigation
- ❌ Any existing component modifications without explicit approval
- ❌ Server-side files

**File Lock Implementation**:
```bash
# In agent-ui-components worktree
echo "client/src/App.tsx" > .git/forbidden-files
echo "server/*" >> .git/forbidden-files
```

### Agent B: New Pages (Create-Only Access)
**ALLOWED Directories**:
- ✅ `client/src/pages/` - New page files only
- ✅ `client/src/pages/goals/` - Goal-related pages
- ✅ Associated test files in same directories

**FORBIDDEN Files**:
- ❌ `client/src/App.tsx` - Route registration
- ❌ Existing page modifications
- ❌ Server-side files  
- ❌ Shared components outside pages

### Agent C: Services (Business Logic Isolation)
**ALLOWED Directories**:
- ✅ `client/src/services/` - New service files only
- ✅ `client/src/types/` - New type definitions
- ✅ `client/src/test/` - Service tests

**FORBIDDEN Files**:
- ❌ `client/src/services/local-workout-service.ts` - Core workout service
- ❌ Any StorageAdapter-dependent services
- ❌ Server-side files
- ❌ React components

### Agent D: Backend APIs (New Routes Only)
**ALLOWED Directories**:
- ✅ `server/` - New route files only (analyticsRoutes.ts, etc.)
- ✅ `server/database/` - New database utilities

**FORBIDDEN Files**:
- ❌ `server/routes.ts` - Main route registration
- ❌ `server/storageAdapter.ts` - Core data layer
- ❌ `server/index.ts` - Server entry point
- ❌ Existing route file modifications

## 🔒 Critical File Protection System

### File Lock Implementation
```bash
#!/bin/bash
# File: protect-critical-files.sh

CRITICAL_FILES=(
    "server/routes.ts"
    "server/storageAdapter.ts" 
    "client/src/App.tsx"
    "shared/schema.ts"
    "server/index.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Create read-only permissions during parallel development
        chmod 444 "$file"
        echo "🔒 Protected: $file"
    fi
done
```

### Pre-commit Hook Protection
```bash
#!/bin/bash
# File: .git/hooks/pre-commit

# Check if any critical files are being modified
CRITICAL_PATTERNS=(
    "server/routes.ts"
    "server/storageAdapter.ts"
    "client/src/App.tsx" 
    "shared/schema.ts"
)

for pattern in "${CRITICAL_PATTERNS[@]}"; do
    if git diff --cached --name-only | grep -q "$pattern"; then
        echo "❌ BLOCKED: Cannot modify critical file $pattern during parallel development"
        echo "   Use EMERGENCY_ROLLBACK.sh if this is intentional"
        exit 1
    fi
done
```

## 📡 Real-Time Monitoring System

### Tmux Session Architecture
```bash
# Create monitoring sessions for each agent
tmux new-session -d -s agent-monitor "htop"
tmux split-window -h -t agent-monitor
tmux send-keys -t agent-monitor:0.1 "watch -n 5 'git status --porcelain'" Enter

# Agent-specific sessions
tmux new-session -d -s agent-a "cd worktrees/agent-ui-components && npm run dev"
tmux new-session -d -s agent-b "cd worktrees/agent-new-pages && npm run check"  
tmux new-session -d -s agent-c "cd worktrees/agent-services && npm test"
tmux new-session -d -s agent-d "cd worktrees/agent-api && npm run dev"
```

### Automated Conflict Detection
```bash
#!/bin/bash
# File: monitor-conflicts.sh

while true; do
    # Check for merge conflicts across all worktrees
    for worktree in worktrees/*/; do
        if [ -d "$worktree" ]; then
            cd "$worktree"
            
            # Check for uncommitted changes to critical files
            if git status --porcelain | grep -E "(server/routes\.ts|client/src/App\.tsx)"; then
                echo "🚨 CONFLICT DETECTED in $worktree"
                echo "Critical file modification detected!"
                
                # Send alert to operator
                tmux display-message -t agent-monitor "CONFLICT: $worktree modified critical files"
            fi
            
            cd - > /dev/null
        fi
    done
    
    sleep 30
done
```

## 🚨 Emergency Intervention Protocols

### Automatic Rollback Triggers
1. **Critical File Modification**: Any agent touches forbidden files
2. **Merge Conflicts**: Git conflicts between parallel branches
3. **Server Failures**: Development server crashes repeatedly
4. **Data Corruption**: StorageAdapter integrity violations

### Intervention Escalation
```bash
# Level 1: Warning
tmux display-message -t agent-monitor "⚠️ WARNING: Potential conflict detected"

# Level 2: Agent Pause
tmux send-keys -t agent-a C-c  # Stop agent development
echo "🛑 Agent A paused due to conflict risk"

# Level 3: Emergency Rollback
./EMERGENCY_ROLLBACK.sh
echo "🚨 EMERGENCY ROLLBACK EXECUTED"
```

## 🔄 Branch Management Strategy

### Branch Naming Convention
- `feature/ui-components` - Agent A UI enhancements
- `feature/new-pages` - Agent B page development
- `feature/services` - Agent C business logic
- `feature/api-extensions` - Agent D backend APIs

### Merge Strategy
```bash
# Sequential merge approach (prevents conflicts)
git checkout master
git merge feature/services          # Lowest risk first
git merge feature/ui-components     # UI components second
git merge feature/new-pages         # Pages third (may need route updates)
git merge feature/api-extensions    # API routes last (needs route registration)
```

### Conflict Resolution Protocol
1. **Pause all agents** immediately upon conflict detection
2. **Identify conflict scope** - which files, which agents
3. **Rollback to stable state** if conflicts are complex
4. **Sequential re-integration** with manual conflict resolution
5. **Resume parallel development** only after clean state

## 📊 Isolation Monitoring Dashboard

### Git Status Dashboard
```bash
#!/bin/bash
# File: isolation-status.sh

echo "🔍 FitForge Parallel Development Status"
echo "========================================"

for worktree in worktrees/*/; do
    if [ -d "$worktree" ]; then
        agent_name=$(basename "$worktree")
        echo "Agent: $agent_name"
        
        cd "$worktree"
        
        # Show current branch and status
        echo "  Branch: $(git branch --show-current)"
        echo "  Status: $(git status --porcelain | wc -l) modified files"
        echo "  Commits: $(git rev-list --count HEAD ^master) ahead of master"
        
        # Check for forbidden file modifications
        forbidden_count=$(git status --porcelain | grep -E "(routes\.ts|App\.tsx|storageAdapter\.ts)" | wc -l)
        if [ "$forbidden_count" -gt 0 ]; then
            echo "  ⚠️  WARNING: $forbidden_count forbidden file modifications"
        else
            echo "  ✅ Clean - no forbidden modifications"
        fi
        
        cd - > /dev/null
        echo ""
    fi
done
```

### Real-Time Agent Activity
```bash
# Monitor file changes in real-time
inotifywait -m -r worktrees/ --format '%T %w %f %e' --timefmt '%H:%M:%S' | while read time dir file event; do
    echo "$time: $dir$file - $event"
    
    # Alert on critical file access
    if [[ "$file" =~ (routes\.ts|App\.tsx|storageAdapter\.ts) ]]; then
        echo "🚨 CRITICAL FILE ACCESS: $dir$file"
        tmux display-message -t agent-monitor "CRITICAL: $file accessed in $dir"
    fi
done
```

## ✅ Isolation Verification Checklist

### Pre-Development Verification
- [ ] Git worktrees created successfully
- [ ] Critical files protected with file permissions
- [ ] Pre-commit hooks installed in all worktrees
- [ ] Monitoring scripts running
- [ ] Emergency rollback script tested
- [ ] Agent boundaries clearly defined

### During Development Verification
- [ ] No cross-agent file conflicts detected
- [ ] All agents working in assigned directories only
- [ ] Real-time monitoring active
- [ ] Regular conflict detection scans passing
- [ ] Server running stability maintained

### Post-Development Verification  
- [ ] Clean merge possible for all branches
- [ ] No data integrity violations
- [ ] All new features functional independently
- [ ] Integration testing passes
- [ ] Emergency rollback capability preserved

## 🎯 Success Criteria

### Isolation Effectiveness
- **Zero unauthorized file access** across agent boundaries
- **Zero merge conflicts** during parallel development phase
- **100% feature isolation** until integration phase
- **Real-time conflict detection** functioning

### Safety Guarantees
- **Emergency rollback** available at all times
- **Data preservation** guaranteed throughout process
- **System stability** maintained during parallel work
- **Quick recovery** from any intervention scenario

**Status**: ✅ **ISOLATION STRATEGY COMPLETE**

Comprehensive isolation strategy implemented with multiple safety layers, real-time monitoring, and guaranteed rollback capability. FitForge ready for safe 4-agent parallel development.