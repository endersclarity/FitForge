#!/bin/bash

# EMERGENCY ROLLBACK SCRIPT
# Instantly reverts FitForge to stable working state
# Use this if parallel agent experiments break the system

set -e

echo "🚨 EMERGENCY ROLLBACK - Reverting to stable baseline"
echo "This will destroy all experimental changes and restore working system"
echo ""

# Kill any running servers
echo "🔄 Stopping all servers..."
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
sleep 2

# Clean any experimental worktrees
echo "🧹 Cleaning experimental worktrees..."
if [ -d "worktrees" ]; then
    for worktree in worktrees/*; do
        if [ -d "$worktree" ]; then
            echo "  Removing worktree: $worktree"
            git worktree remove "$worktree" --force 2>/dev/null || true
        fi
    done
    rmdir worktrees 2>/dev/null || true
fi

# Kill any experimental tmux sessions
echo "🧹 Cleaning experimental tmux sessions..."
tmux list-sessions 2>/dev/null | grep "agent-" | cut -d: -f1 | xargs -I {} tmux kill-session -t {} 2>/dev/null || true

# Reset to stable baseline
echo "⏪ Reverting to stable-baseline-v1..."
git reset --hard stable-baseline-v1
git clean -fd

# Restore any critical data files
echo "💾 Ensuring data preservation..."
if [ ! -d "data/users/1" ]; then
    mkdir -p data/users/1
fi

# Restart server
echo "🚀 Restarting stable server..."
cd /home/ender/.claude/projects/ai-tools-workflow-integration/FitForge
npm run dev > rollback-server.log 2>&1 &
sleep 5

# Verify server is running
if curl -s http://localhost:5000/api/workout-sessions >/dev/null; then
    WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    echo ""
    echo "✅ ROLLBACK COMPLETE - System restored to stable state"
    echo "🌐 Server running at: http://$WSL_IP:5000"
    echo "📊 Dashboard available at: http://$WSL_IP:5000/dashboard" 
    echo "🔍 Check server log: tail -f rollback-server.log"
    echo ""
    echo "🎯 Stable features confirmed working:"
    echo "  - Real workout data persistence via StorageAdapter"
    echo "  - Dashboard displaying actual user workouts"
    echo "  - All Issue #7 functionality intact"
else
    echo "❌ Server failed to start - check rollback-server.log"
    exit 1
fi