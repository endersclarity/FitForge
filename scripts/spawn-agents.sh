#!/bin/bash
# FitForge Agent Spawn System
# Executes /spawn command with 4-agent horizontal orchestration

set -e

echo "🚀 FITFORGE AGENT SPAWN SYSTEM INITIATED"
echo "========================================"
echo "Deploying 4 specialized agents for parallel development"
echo "Safety measures: Emergency rollback, monitoring, isolation"
echo ""

# Verify prerequisites
echo "✅ Checking prerequisites..."

# Check git worktrees exist
if [ ! -d "worktrees/agent-ui-components" ] || [ ! -d "worktrees/agent-new-pages" ] || [ ! -d "worktrees/agent-services" ] || [ ! -d "worktrees/agent-api" ]; then
    echo "❌ Git worktrees missing. Run setup first."
    exit 1
fi

# Check strategic tasks exist
if [ ! -f ".taskmaster/tasks/strategic-parallel-tasks.json" ]; then
    echo "❌ Strategic tasks file missing."
    exit 1
fi

# Check emergency rollback exists
if [ ! -f "EMERGENCY_ROLLBACK.sh" ]; then
    echo "❌ Emergency rollback script missing."
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

# Create tmux sessions for each agent
echo "🎛️ Creating agent control sessions..."

# Agent A: UI Component Enhancement
tmux new-session -d -s agent-a -c "worktrees/agent-ui-components"
tmux send-keys -t agent-a "echo '🎨 AGENT A: UI Component Enhancement Track'" Enter
tmux send-keys -t agent-a "echo 'Tasks: Enhanced 3D Muscle Visualization, Advanced Progress Charts, Intelligent Workout Timer'" Enter
tmux send-keys -t agent-a "echo 'Boundary: client/src/components/ only'" Enter
tmux split-window -h -t agent-a
tmux send-keys -t agent-a:0.1 "watch -n 30 'git status --porcelain | head -10'" Enter

# Agent B: New Page Development 
tmux new-session -d -s agent-b -c "worktrees/agent-new-pages"
tmux send-keys -t agent-b "echo '📄 AGENT B: New Page Development Track'" Enter
tmux send-keys -t agent-b "echo 'Tasks: Analytics Dashboard, Exercise Library Browser, Goal Setting Wizard'" Enter
tmux send-keys -t agent-b "echo 'Boundary: client/src/pages/ only'" Enter
tmux split-window -h -t agent-b
tmux send-keys -t agent-b:0.1 "watch -n 30 'git status --porcelain | head -10'" Enter

# Agent C: Services & Business Logic
tmux new-session -d -s agent-c -c "worktrees/agent-services"
tmux send-keys -t agent-c "echo '⚙️ AGENT C: Services & Business Logic Track'" Enter
tmux send-keys -t agent-c "echo 'Tasks: AI Progressive Overload Engine, Workout Recommendations, Achievement System'" Enter
tmux send-keys -t agent-c "echo 'Boundary: client/src/services/ and client/src/types/ only'" Enter
tmux split-window -h -t agent-c
tmux send-keys -t agent-c:0.1 "watch -n 30 'git status --porcelain | head -10'" Enter

# Agent D: Backend API Extensions
tmux new-session -d -s agent-d -c "worktrees/agent-api"
tmux send-keys -t agent-d "echo '🔧 AGENT D: Backend API Extensions Track'" Enter
tmux send-keys -t agent-d "echo 'Tasks: Analytics API, Social Features Backend, Notification System'" Enter
tmux send-keys -t agent-d "echo 'Boundary: server/*Routes.ts files only'" Enter
tmux split-window -h -t agent-d
tmux send-keys -t agent-d:0.1 "watch -n 30 'git status --porcelain | head -10'" Enter

# Create monitoring dashboard
echo "📊 Setting up monitoring dashboard..."
tmux new-session -d -s fitforge-monitor
tmux send-keys -t fitforge-monitor "echo '🎛️ FITFORGE PARALLEL DEVELOPMENT MONITOR'" Enter
tmux send-keys -t fitforge-monitor "echo '========================================='" Enter
tmux send-keys -t fitforge-monitor "echo 'Monitoring 4 agents for conflicts and progress'" Enter
tmux send-keys -t fitforge-monitor "echo ''" Enter
tmux send-keys -t fitforge-monitor "git worktree list" Enter
tmux split-window -h -t fitforge-monitor
tmux send-keys -t fitforge-monitor:0.1 "./scripts/conflict-monitor.sh" Enter

# Start conflict monitoring
chmod +x scripts/conflict-monitor.sh
tmux new-session -d -s conflict-monitor "./scripts/conflict-monitor.sh"

echo "✅ Agent spawn complete!"
echo ""
echo "🎮 AGENT CONTROL SESSIONS:"
echo "   Agent A (UI): tmux attach-session -t agent-a"
echo "   Agent B (Pages): tmux attach-session -t agent-b"
echo "   Agent C (Services): tmux attach-session -t agent-c"
echo "   Agent D (API): tmux attach-session -t agent-d"
echo ""
echo "📊 MONITORING:"
echo "   Main Dashboard: tmux attach-session -t fitforge-monitor"
echo "   Conflict Monitor: tmux attach-session -t conflict-monitor"
echo ""
echo "🚨 EMERGENCY CONTROLS:"
echo "   Emergency Rollback: ./EMERGENCY_ROLLBACK.sh"
echo "   Pause All: tmux send-keys -t agent-a C-c; tmux send-keys -t agent-b C-c; tmux send-keys -t agent-c C-c; tmux send-keys -t agent-d C-c"
echo ""

# Show current system status
echo "📈 CURRENT SYSTEM STATUS:"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
git worktree list | grep -E "(agent-|worktrees)" | wc -l | xargs echo "Active worktrees:"
tmux list-sessions | grep -E "(agent-|fitforge-monitor|conflict-monitor)" | wc -l | xargs echo "Active monitoring sessions:"

echo ""
echo "🎯 PARALLEL DEVELOPMENT INITIATED"
echo "4 agents ready for isolated feature development"
echo "All safety measures active - proceed with confidence!"
echo ""
echo "Next: Connect to agent sessions and begin parallel development"
echo "Remember: Each agent has strict file boundaries for safe isolation"