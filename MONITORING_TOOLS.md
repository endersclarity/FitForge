# FitForge Parallel Agent Monitoring Tools

**Generated**: 2025-06-05  
**Purpose**: Real-time monitoring and coordination tools for 4-agent parallel development  
**Safety**: Emergency intervention and rollback capabilities

## 🎛️ Monitoring Dashboard Architecture

### Tmux Session Structure
```
fitforge-monitor (main session)
├── agent-status      # Agent activity dashboard
├── conflict-watch    # Real-time conflict detection
├── git-monitor       # Git status across all worktrees
└── system-health     # Server and build status

agent-a (UI Components)
├── development       # Active development terminal
├── build-watch       # TypeScript/build monitoring
└── test-runner       # Component testing

agent-b (New Pages)
├── development       # Active development terminal
├── route-check       # Route conflict detection
└── integration-test  # Page integration testing

agent-c (Services)
├── development       # Active development terminal
├── test-runner       # Service testing
└── performance       # Performance monitoring

agent-d (Backend APIs)
├── development       # Active development terminal
├── server-test       # API endpoint testing
└── db-monitor        # Database/storage monitoring
```

## 🚨 Real-Time Conflict Detection

### File Change Monitor
```bash
#!/bin/bash
# File: scripts/conflict-monitor.sh

# Monitor critical files for unauthorized changes
CRITICAL_FILES=(
    "server/routes.ts"
    "server/storageAdapter.ts"
    "client/src/App.tsx"
    "shared/schema.ts"
)

# Set up file watchers
for file in "${CRITICAL_FILES[@]}"; do
    inotifywait -m "$file" --format '%T %w %e' --timefmt '%H:%M:%S' &
    echo "👁️ Watching critical file: $file"
done

# Monitor all worktrees for cross-agent file access
inotifywait -m -r worktrees/ --format '%T %w %f %e' --timefmt '%H:%M:%S' | while read time dir file event; do
    agent_dir=$(echo "$dir" | cut -d'/' -f2)
    
    # Check if agent is accessing files outside their boundary
    case "$agent_dir" in
        "agent-ui-components")
            if [[ ! "$file" =~ ^(client/src/components/|client/src/test/) ]]; then
                echo "🚨 BOUNDARY VIOLATION: Agent A accessing $dir$file"
                tmux display-message -t fitforge-monitor "🚨 Agent A violated boundaries: $file"
            fi
            ;;
        "agent-new-pages")
            if [[ ! "$file" =~ ^(client/src/pages/|client/src/test/) ]]; then
                echo "🚨 BOUNDARY VIOLATION: Agent B accessing $dir$file"
                tmux display-message -t fitforge-monitor "🚨 Agent B violated boundaries: $file"
            fi
            ;;
        "agent-services")
            if [[ ! "$file" =~ ^(client/src/services/|client/src/types/|client/src/test/) ]]; then
                echo "🚨 BOUNDARY VIOLATION: Agent C accessing $dir$file"
                tmux display-message -t fitforge-monitor "🚨 Agent C violated boundaries: $file"
            fi
            ;;
        "agent-api")
            if [[ ! "$file" =~ ^(server/.*Routes\.ts|server/database/) ]]; then
                echo "🚨 BOUNDARY VIOLATION: Agent D accessing $dir$file"
                tmux display-message -t fitforge-monitor "🚨 Agent D violated boundaries: $file"
            fi
            ;;
    esac
done
```

### Git Status Monitor
```bash
#!/bin/bash
# File: scripts/git-monitor.sh

while true; do
    clear
    echo "🔍 FitForge Parallel Development Git Status"
    echo "==========================================="
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Main repository status
    echo "📁 Main Repository (master):"
    git status --porcelain | head -10
    echo "  Commits ahead: $(git rev-list --count HEAD ^origin/master 2>/dev/null || echo '0')"
    echo ""
    
    # Worktree status
    for worktree in worktrees/*/; do
        if [ -d "$worktree" ]; then
            agent_name=$(basename "$worktree")
            echo "🔧 $agent_name:"
            
            cd "$worktree"
            branch=$(git branch --show-current)
            modified=$(git status --porcelain | wc -l)
            commits=$(git rev-list --count HEAD ^master 2>/dev/null || echo '0')
            
            echo "  Branch: $branch"
            echo "  Modified files: $modified"
            echo "  Commits ahead: $commits"
            
            # Check for merge conflicts
            if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
                echo "  ⚠️  MERGE CONFLICTS DETECTED"
                tmux display-message -t fitforge-monitor "🚨 MERGE CONFLICTS in $agent_name"
            fi
            
            # Check for forbidden file modifications
            forbidden=$(git status --porcelain | grep -E "(routes\.ts|App\.tsx|storageAdapter\.ts)" | wc -l)
            if [ "$forbidden" -gt 0 ]; then
                echo "  🚨 FORBIDDEN FILE MODIFICATIONS: $forbidden"
                tmux display-message -t fitforge-monitor "🚨 $agent_name modified forbidden files"
            fi
            
            cd - > /dev/null
            echo ""
        fi
    done
    
    sleep 10
done
```

## 📊 Agent Activity Dashboard

### Real-Time Development Status
```bash
#!/bin/bash
# File: scripts/agent-dashboard.sh

# Create monitoring dashboard
create_dashboard() {
    tmux new-session -d -s fitforge-monitor
    
    # Main monitoring pane
    tmux send-keys -t fitforge-monitor "watch -n 5 './scripts/git-monitor.sh'" Enter
    
    # Split for conflict monitoring
    tmux split-window -h -t fitforge-monitor
    tmux send-keys -t fitforge-monitor:0.1 "./scripts/conflict-monitor.sh" Enter
    
    # Split for system health
    tmux split-window -v -t fitforge-monitor:0.0
    tmux send-keys -t fitforge-monitor:0.2 "htop" Enter
    
    # Split for build status
    tmux split-window -v -t fitforge-monitor:0.1
    tmux send-keys -t fitforge-monitor:0.3 "watch -n 10 './scripts/build-status.sh'" Enter
    
    echo "✅ Monitoring dashboard created: tmux attach-session -t fitforge-monitor"
}

# Build status checker
create_build_monitor() {
    cat > scripts/build-status.sh << 'EOF'
#!/bin/bash
echo "🔨 FitForge Build Status Dashboard"
echo "=================================="
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Check TypeScript compilation
echo "📝 TypeScript Status:"
if npm run check > /dev/null 2>&1; then
    echo "  ✅ TypeScript compilation: PASSING"
else
    echo "  ❌ TypeScript compilation: FAILING"
fi

# Check if server is running
echo "🖥️ Server Status:"
if curl -s http://localhost:5000/api/auth/me > /dev/null; then
    echo "  ✅ Server: RUNNING (port 5000)"
else
    echo "  ❌ Server: NOT RUNNING"
fi

# Check each worktree build status
for worktree in worktrees/*/; do
    if [ -d "$worktree" ]; then
        agent_name=$(basename "$worktree")
        echo "🔧 $agent_name Build:"
        
        cd "$worktree"
        if npm run check > /dev/null 2>&1; then
            echo "  ✅ TypeScript: PASSING"
        else
            echo "  ❌ TypeScript: FAILING"
        fi
        cd - > /dev/null
    fi
done
EOF
    chmod +x scripts/build-status.sh
}

create_dashboard
create_build_monitor
```

### Agent Performance Metrics
```bash
#!/bin/bash
# File: scripts/performance-monitor.sh

# Monitor agent development performance
monitor_agent_performance() {
    while true; do
        echo "📈 Agent Performance Metrics - $(date '+%H:%M:%S')"
        echo "================================================"
        
        for worktree in worktrees/*/; do
            if [ -d "$worktree" ]; then
                agent_name=$(basename "$worktree")
                cd "$worktree"
                
                # Count files modified in last hour
                recent_changes=$(git log --since="1 hour ago" --name-only --pretty=format: | sort | uniq | wc -l)
                
                # Count commits in last hour
                recent_commits=$(git log --since="1 hour ago" --oneline | wc -l)
                
                # Check test status
                if [ -d "client/src/test" ] || [ -d "test" ]; then
                    test_files=$(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)
                else
                    test_files=0
                fi
                
                echo "$agent_name:"
                echo "  Files changed (1h): $recent_changes"
                echo "  Commits (1h): $recent_commits"
                echo "  Test files: $test_files"
                echo "  Productivity: $((recent_changes + recent_commits * 2)) points"
                echo ""
                
                cd - > /dev/null
            fi
        done
        
        sleep 300  # Update every 5 minutes
    done
}

monitor_agent_performance
```

## 🔧 Automated Intervention System

### Conflict Resolution Triggers
```bash
#!/bin/bash
# File: scripts/auto-intervention.sh

# Automated intervention system
check_intervention_triggers() {
    while true; do
        # Check for critical violations
        for worktree in worktrees/*/; do
            if [ -d "$worktree" ]; then
                agent_name=$(basename "$worktree")
                cd "$worktree"
                
                # Level 1: Warning - Modified files approaching limits
                modified_count=$(git status --porcelain | wc -l)
                if [ "$modified_count" -gt 20 ]; then
                    tmux display-message -t fitforge-monitor "⚠️ $agent_name: High modification count ($modified_count files)"
                fi
                
                # Level 2: Critical - Forbidden file access
                if git status --porcelain | grep -E "(routes\.ts|App\.tsx|storageAdapter\.ts)"; then
                    echo "🚨 CRITICAL: $agent_name accessing forbidden files"
                    tmux display-message -t fitforge-monitor "🚨 CRITICAL: $agent_name forbidden access"
                    
                    # Auto-pause agent
                    tmux send-keys -t "agent-${agent_name##*-}" C-c
                    echo "🛑 Agent $agent_name paused automatically"
                fi
                
                # Level 3: Emergency - Merge conflicts
                if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
                    echo "🚨 EMERGENCY: Merge conflicts in $agent_name"
                    echo "Initiating emergency rollback protocol..."
                    
                    # Execute emergency rollback
                    cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge
                    ./EMERGENCY_ROLLBACK.sh
                    
                    exit 1
                fi
                
                cd - > /dev/null
            fi
        done
        
        sleep 30
    done
}

check_intervention_triggers
```

### Progress Synchronization
```bash
#!/bin/bash
# File: scripts/sync-progress.sh

# Synchronize agent progress every 2 hours
sync_agent_progress() {
    echo "🔄 Agent Progress Synchronization - $(date)"
    echo "=========================================="
    
    # Create progress report
    progress_report="AGENT_PROGRESS_$(date +%Y%m%d_%H%M).md"
    
    cat > "$progress_report" << EOF
# Agent Progress Report
**Generated**: $(date '+%Y-%m-%d %H:%M:%S')

## Progress Summary
EOF
    
    total_agents=0
    completed_agents=0
    
    for worktree in worktrees/*/; do
        if [ -d "$worktree" ]; then
            agent_name=$(basename "$worktree")
            total_agents=$((total_agents + 1))
            
            cd "$worktree"
            
            # Calculate progress metrics
            commits=$(git rev-list --count HEAD ^master 2>/dev/null || echo '0')
            files_changed=$(git diff --name-only master | wc -l)
            
            # Estimate completion based on task count (from breakdown)
            case "$agent_name" in
                "agent-ui-components") target_tasks=6 ;;
                "agent-new-pages") target_tasks=6 ;;
                "agent-services") target_tasks=6 ;;
                "agent-api") target_tasks=6 ;;
                *) target_tasks=5 ;;
            esac
            
            progress_percent=$((commits * 100 / target_tasks))
            if [ $progress_percent -ge 100 ]; then
                completed_agents=$((completed_agents + 1))
            fi
            
            cat >> "$progress_report" << EOF

### $agent_name
- **Progress**: ${progress_percent}% (${commits}/${target_tasks} tasks)
- **Files modified**: $files_changed
- **Status**: $([ $progress_percent -ge 100 ] && echo "✅ COMPLETE" || echo "🔄 IN PROGRESS")
EOF
            
            cd - > /dev/null
        fi
    done
    
    cat >> "$progress_report" << EOF

## Overall Status
- **Agents completed**: $completed_agents/$total_agents
- **Overall progress**: $((completed_agents * 100 / total_agents))%
- **Ready for integration**: $([ $completed_agents -eq $total_agents ] && echo "✅ YES" || echo "❌ NO")
EOF
    
    echo "📊 Progress report saved: $progress_report"
    tmux display-message -t fitforge-monitor "📊 Progress sync complete: $completed_agents/$total_agents agents ready"
}

# Run sync every 2 hours
while true; do
    sync_agent_progress
    sleep 7200  # 2 hours
done
```

## 🎮 Operator Control Interface

### Command Shortcuts
```bash
#!/bin/bash
# File: scripts/operator-commands.sh

# Operator control commands
operator_pause_all() {
    echo "🛑 Pausing all agents..."
    for session in agent-a agent-b agent-c agent-d; do
        tmux send-keys -t "$session" C-c 2>/dev/null || true
    done
    tmux display-message -t fitforge-monitor "🛑 All agents paused"
}

operator_resume_all() {
    echo "▶️ Resuming all agents..."
    for session in agent-a agent-b agent-c agent-d; do
        tmux send-keys -t "$session" "npm run dev" Enter 2>/dev/null || true
    done
    tmux display-message -t fitforge-monitor "▶️ All agents resumed"
}

operator_status() {
    echo "📊 System Status:"
    ./scripts/git-monitor.sh | head -20
    echo ""
    echo "🔧 Active Sessions:"
    tmux list-sessions | grep -E "(agent-|fitforge-monitor)"
}

operator_emergency() {
    echo "🚨 EMERGENCY ROLLBACK INITIATED"
    ./EMERGENCY_ROLLBACK.sh
}

# Create operator keybindings
tmux bind-key -T root F1 run-shell "~/scripts/operator-commands.sh status"
tmux bind-key -T root F2 run-shell "~/scripts/operator-commands.sh pause_all"
tmux bind-key -T root F3 run-shell "~/scripts/operator-commands.sh resume_all"
tmux bind-key -T root F4 run-shell "~/scripts/operator-commands.sh emergency"
```

## 📋 Monitoring Setup Script

### Complete Setup
```bash
#!/bin/bash
# File: setup-monitoring.sh

echo "🎛️ Setting up FitForge parallel development monitoring..."

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Make all monitoring scripts executable
chmod +x scripts/*.sh

# Create monitoring tmux session
./scripts/agent-dashboard.sh

# Start conflict monitoring
tmux new-session -d -s conflict-monitor "./scripts/conflict-monitor.sh"

# Start performance monitoring
tmux new-session -d -s performance-monitor "./scripts/performance-monitor.sh"

# Start intervention system
tmux new-session -d -s auto-intervention "./scripts/auto-intervention.sh"

echo "✅ Monitoring system active:"
echo "   📊 Main dashboard: tmux attach-session -t fitforge-monitor"
echo "   🚨 Conflict monitor: tmux attach-session -t conflict-monitor"
echo "   📈 Performance: tmux attach-session -t performance-monitor"
echo "   🔧 Auto-intervention: tmux attach-session -t auto-intervention"
echo ""
echo "🎮 Operator Commands:"
echo "   F1 - System Status"
echo "   F2 - Pause All Agents"
echo "   F3 - Resume All Agents"
echo "   F4 - Emergency Rollback"
```

## ✅ Monitoring Features Summary

### Real-Time Monitoring
- **File change detection** with boundary enforcement
- **Git status monitoring** across all worktrees
- **Build status tracking** for TypeScript and server
- **Performance metrics** for each agent

### Automated Intervention
- **Boundary violation detection** with instant alerts
- **Conflict prevention** through file access monitoring
- **Emergency rollback** triggered by critical violations
- **Progress synchronization** every 2 hours

### Operator Control
- **Centralized dashboard** via tmux sessions
- **Agent pause/resume** capabilities
- **System status** at-a-glance
- **Emergency controls** for immediate intervention

**Status**: ✅ **MONITORING SYSTEM COMPLETE**

Comprehensive monitoring and intervention system ready for 4-agent parallel development with real-time conflict detection, automated safety measures, and operator control interface.