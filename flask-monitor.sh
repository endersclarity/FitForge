#!/bin/bash

# FitForge Flask Monitor - Advanced Process Management
# Keeps Flask server running with intelligent restart and health monitoring

PROJECT_DIR="/home/ender/.claude/projects/ai-tools-workflow-integration/FitForge"
FLASK_PID_FILE="$PROJECT_DIR/.flask-dev.pid"
FLASK_LOG_FILE="$PROJECT_DIR/.flask-dev.log"
PORT=5000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get WSL IP
WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)

print_status() {
    echo -e "${BLUE}🔍 FitForge Flask Server Status${NC}"
    echo -e "${BLUE}==============================${NC}"
    
    if [ -f "$FLASK_PID_FILE" ]; then
        local pid=$(cat "$FLASK_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is running (PID: $pid)${NC}"
            echo -e "${GREEN}🌐 Access at: http://$WSL_IP:$PORT${NC}"
            
            # Test if server is responding
            if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Server is responding to requests${NC}"
            else
                echo -e "${YELLOW}⚠️  Server process exists but not responding${NC}"
            fi
        else
            echo -e "${RED}❌ Server is not running (stale PID file)${NC}"
            rm -f "$FLASK_PID_FILE"
        fi
    else
        echo -e "${RED}❌ Server is not running${NC}"
    fi
}

start_server() {
    if [ -f "$FLASK_PID_FILE" ]; then
        local pid=$(cat "$FLASK_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Server is already running (PID: $pid)${NC}"
            return 0
        fi
    fi
    
    echo -e "${BLUE}🚀 Starting FitForge server...${NC}"
    cd "$PROJECT_DIR"
    
    # Start server in background and capture PID
    nohup ./run-flask-dev.sh > "$FLASK_LOG_FILE" 2>&1 &
    local server_pid=$!
    
    echo $server_pid > "$FLASK_PID_FILE"
    echo -e "${GREEN}✅ Server started (PID: $server_pid)${NC}"
    
    # Wait and test
    sleep 5
    if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
        echo -e "${GREEN}🌐 Server is ready at: http://$WSL_IP:$PORT${NC}"
    else
        echo -e "${YELLOW}⏳ Server starting... (may take a few more seconds)${NC}"
    fi
}

stop_server() {
    if [ -f "$FLASK_PID_FILE" ]; then
        local pid=$(cat "$FLASK_PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Stopping server (PID: $pid)...${NC}"
            kill $pid
            sleep 2
            
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}⚡ Force killing server...${NC}"
                kill -9 $pid
            fi
            
            rm -f "$FLASK_PID_FILE"
            echo -e "${GREEN}✅ Server stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  Server was not running${NC}"
            rm -f "$FLASK_PID_FILE"
        fi
    else
        echo -e "${YELLOW}⚠️  No server PID file found${NC}"
    fi
    
    # Cleanup any remaining processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx.*server" 2>/dev/null || true
}

restart_server() {
    echo -e "${BLUE}🔄 Restarting FitForge server...${NC}"
    stop_server
    sleep 2
    start_server
}

show_logs() {
    if [ -f "$FLASK_LOG_FILE" ]; then
        echo -e "${BLUE}📄 Server logs (last 50 lines):${NC}"
        tail -50 "$FLASK_LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  No log file found${NC}"
    fi
}

follow_logs() {
    if [ -f "$FLASK_LOG_FILE" ]; then
        echo -e "${BLUE}📄 Following server logs (Ctrl+C to stop):${NC}"
        tail -f "$FLASK_LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  No log file found${NC}"
    fi
}

health_check() {
    echo -e "${BLUE}🏥 Health check...${NC}"
    
    # Check if process is running
    if [ -f "$FLASK_PID_FILE" ]; then
        local pid=$(cat "$FLASK_PID_FILE")
        if ! ps -p $pid > /dev/null 2>&1; then
            echo -e "${RED}❌ Process not running - restarting...${NC}"
            restart_server
            return
        fi
    else
        echo -e "${RED}❌ No PID file - starting server...${NC}"
        start_server
        return
    fi
    
    # Check if server responds
    if ! curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
        echo -e "${RED}❌ Server not responding - restarting...${NC}"
        restart_server
        return
    fi
    
    echo -e "${GREEN}✅ Server is healthy${NC}"
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        print_status
        ;;
    logs)
        show_logs
        ;;
    follow)
        follow_logs
        ;;
    health)
        health_check
        ;;
    *)
        echo -e "${BLUE}FitForge Flask Server Manager${NC}"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|follow|health}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the Flask server"
        echo "  stop    - Stop the Flask server"
        echo "  restart - Restart the Flask server"
        echo "  status  - Show server status"
        echo "  logs    - Show recent server logs"
        echo "  follow  - Follow server logs in real-time"
        echo "  health  - Check server health and auto-restart if needed"
        echo ""
        print_status
        ;;
esac