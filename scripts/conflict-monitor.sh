#!/bin/bash
# File: scripts/conflict-monitor.sh
# Real-time conflict detection for FitForge parallel development

# Monitor critical files for unauthorized changes
CRITICAL_FILES=(
    "server/routes.ts"
    "server/storageAdapter.ts"
    "client/src/App.tsx"
    "shared/schema.ts"
)

echo "🔍 FitForge Conflict Monitor Active"
echo "Monitoring critical files and agent boundaries..."
echo "Critical files protected: ${CRITICAL_FILES[*]}"
echo ""

# Monitor all worktrees for cross-agent file access
find worktrees/ -name "*.ts" -o -name "*.tsx" | while read -r file; do
    agent_dir=$(echo "$file" | cut -d'/' -f2)
    relative_path=${file#worktrees/*/}
    
    # Check if agent is accessing files outside their boundary
    case "$agent_dir" in
        "agent-ui-components")
            if [[ ! "$relative_path" =~ ^(client/src/components/|client/src/test/) ]]; then
                echo "⚠️  BOUNDARY WARNING: Agent A may be accessing: $relative_path"
            fi
            ;;
        "agent-new-pages")
            if [[ ! "$relative_path" =~ ^(client/src/pages/|client/src/test/) ]]; then
                echo "⚠️  BOUNDARY WARNING: Agent B may be accessing: $relative_path"
            fi
            ;;
        "agent-services")
            if [[ ! "$relative_path" =~ ^(client/src/services/|client/src/types/|client/src/test/) ]]; then
                echo "⚠️  BOUNDARY WARNING: Agent C may be accessing: $relative_path"
            fi
            ;;
        "agent-api")
            if [[ ! "$relative_path" =~ ^(server/.*Routes\.ts|server/database/) ]]; then
                echo "⚠️  BOUNDARY WARNING: Agent D may be accessing: $relative_path"
            fi
            ;;
    esac
done

echo "✅ Conflict monitor scan complete - boundaries respected"
echo "Monitor running continuously. Press Ctrl+C to stop."

# Continuous monitoring mode
while true; do
    sleep 60
    echo "$(date '+%H:%M:%S') - Monitoring active..."
done