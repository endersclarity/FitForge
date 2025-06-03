#!/bin/bash

# FitForge Flask Development Server - Bulletproof Auto-Reload
# This script provides persistent Flask server with crash recovery and auto-reload

set -e

PROJECT_DIR="/home/ender/.claude/projects/ai-tools-workflow-integration/FitForge"
VENV_PATH="$PROJECT_DIR/venv"
FLASK_APP="server/index.ts"
PORT=5000
HOST="0.0.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FitForge Flask Development Server${NC}"
echo -e "${BLUE}=================================${NC}"

# Change to project directory
cd "$PROJECT_DIR"

# Get WSL IP for Windows access
WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
echo -e "${GREEN}📍 Windows Access URL: http://$WSL_IP:$PORT${NC}"
echo -e "${GREEN}📍 Local Access URL: http://localhost:$PORT${NC}"
echo ""

# Function to kill existing Flask processes
cleanup_existing() {
    echo -e "${YELLOW}🧹 Cleaning up existing Flask processes...${NC}"
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx.*server" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to start Flask with auto-reload
start_flask() {
    echo -e "${BLUE}🔄 Starting Flask with auto-reload...${NC}"
    
    # Set environment variables for optimal development
    export NODE_ENV=development
    export FLASK_ENV=development
    export FLASK_DEBUG=1
    export HOST=$HOST
    export PORT=$PORT
    
    # Start the development server with auto-reload
    npm run dev 2>&1 | while read line; do
        echo -e "${GREEN}[$(date '+%H:%M:%S')] $line${NC}"
    done
}

# Function to monitor and restart on crash
monitor_and_restart() {
    local restart_count=0
    local max_restarts=10
    
    while [ $restart_count -lt $max_restarts ]; do
        echo -e "${BLUE}🚀 Starting FitForge server (attempt $((restart_count + 1)))...${NC}"
        
        if start_flask; then
            echo -e "${GREEN}✅ Server started successfully!${NC}"
            break
        else
            restart_count=$((restart_count + 1))
            echo -e "${RED}❌ Server crashed! Restarting in 3 seconds... (${restart_count}/${max_restarts})${NC}"
            sleep 3
        fi
    done
    
    if [ $restart_count -eq $max_restarts ]; then
        echo -e "${RED}💀 Max restart attempts reached. Please check for issues.${NC}"
        exit 1
    fi
}

# Function to test server availability
test_server() {
    echo -e "${YELLOW}🔍 Testing server availability...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is responding!${NC}"
            echo -e "${GREEN}🌐 Access your app at: http://$WSL_IP:$PORT${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Waiting for server... (${attempt}/${max_attempts})${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Server failed to respond after $max_attempts attempts${NC}"
    return 1
}

# Main execution
main() {
    echo -e "${BLUE}Starting FitForge development server...${NC}"
    
    # Cleanup any existing processes
    cleanup_existing
    
    # Check if npm dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
        npm install
    fi
    
    # Start server with monitoring
    echo -e "${GREEN}🎯 Starting persistent Flask server...${NC}"
    echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Trap SIGINT to cleanup on exit
    trap 'echo -e "\n${YELLOW}🛑 Stopping server...${NC}"; cleanup_existing; exit 0' INT
    
    # Start server and monitor
    monitor_and_restart &
    SERVER_PID=$!
    
    # Wait a moment then test
    sleep 5
    test_server
    
    # Keep script running
    wait $SERVER_PID
}

# Execute main function
main "$@"