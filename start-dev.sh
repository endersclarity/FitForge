#!/bin/bash
# PERMANENT FIX for WSL dev server access from Windows

# Get WSL IP
WSL_IP=$(ip addr show eth0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)

if [ -z "$WSL_IP" ]; then
  echo "⚠️  Warning: Could not detect WSL IP address"
  echo "🔍 Available interfaces:"
  ip addr show | grep -E "^[0-9]+:" | awk '{print $2}' | tr -d ':'
  echo ""
  echo "📝 Starting server on localhost only..."
  npm run dev
  exit 1
fi

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