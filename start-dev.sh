#!/bin/bash
# PERMANENT FIX for WSL dev server access from Windows

# Get WSL IP
WSL_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)

echo "=========================================="
echo "🚀 Starting FitForge Development Server"
echo "=========================================="
echo ""
echo "📍 WSL IP Address: $WSL_IP"
echo ""
echo "🌐 Access from Windows Browser:"
echo "   http://$WSL_IP:5000"
echo ""
echo "=========================================="

# Start server bound to ALL interfaces (not just localhost)
HOST=0.0.0.0 PORT=5000 npm run dev