#!/bin/bash

# FitForge Node.js Development Server - Bulletproof Auto-Reload
# This script provides persistent Node.js server with crash recovery and auto-reload

set -e

PROJECT_DIR="/home/ender/.claude/projects/ai-tools-workflow-integration/FitForge"
PORT=5000
HOST="0.0.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 FitForge Node.js Development Server${NC}"
echo -e "${BLUE}====================================${NC}"

# Change to project directory
cd "$PROJECT_DIR"

# Get WSL IP for Windows access
WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
echo -e "${GREEN}📍 Windows Access URL: http://$WSL_IP:$PORT${NC}"
echo -e "${GREEN}📍 Local Access URL: http://localhost:$PORT${NC}"
echo ""

# Function to kill existing Node processes
cleanup_existing() {
    echo -e "${YELLOW}🧹 Cleaning up existing Node processes...${NC}"
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx.*server" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to start Node.js with auto-reload
start_node_server() {
    echo -e "${BLUE}🔄 Starting Node.js server with auto-reload...${NC}"
    
    # Set environment variables for optimal development
    export NODE_ENV=development
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
        
        # Start server in background and get PID
        start_node_server &
        SERVER_PID=$!
        
        # Wait for the server process to finish
        wait $SERVER_PID
        EXIT_CODE=$?
        
        if [ $EXIT_CODE -eq 0 ]; then
            echo -e "${GREEN}✅ Server stopped gracefully${NC}"
            break
        else
            restart_count=$((restart_count + 1))
            echo -e "${RED}❌ Server crashed with exit code $EXIT_CODE! Restarting in 3 seconds... (${restart_count}/${max_restarts})${NC}"
            cleanup_existing
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
    
    local max_attempts=15
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
    echo -e "${GREEN}🎯 Starting persistent Node.js server...${NC}"
    echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Trap SIGINT to cleanup on exit
    trap 'echo -e "\n${YELLOW}🛑 Stopping server...${NC}"; cleanup_existing; exit 0' INT
    
    # Start server and monitor
    monitor_and_restart &
    MONITOR_PID=$!
    
    # Wait a moment then test
    sleep 5
    test_server
    
    # Keep script running
    wait $MONITOR_PID
}

# Execute main function
main "$@"