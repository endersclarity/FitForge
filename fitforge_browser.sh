#!/bin/bash
# FitForge Browser Automation

echo "🚀 Starting Chrome with FitForge production site..."
powershell.exe -Command "Start-Process chrome -ArgumentList '--remote-debugging-port=9222','https://fitforge-free-9zezd.ondigitalocean.app'"
sleep 5
echo "✅ Chrome started - FitForge should be loading..."

echo "🔍 Waiting for page to load..."
sleep 10

echo "📸 Taking screenshot via Chrome DevTools..."
# Try to take a screenshot through Chrome DevTools
curl -s "http://localhost:9222/json" > /tmp/chrome_tabs.json
echo "Chrome tabs info saved to /tmp/chrome_tabs.json"

# Get first tab ID and take screenshot
TAB_ID=$(curl -s "http://localhost:9222/json" | jq -r '.[0].id' 2>/dev/null)
if [ "$TAB_ID" != "null" ] && [ ! -z "$TAB_ID" ]; then
    echo "Found tab ID: $TAB_ID"
    curl -s "http://localhost:9222/page/captureScreenshot" -H "Content-Type: application/json" -d '{"format": "png"}' > /tmp/fitforge_screenshot.json
    echo "Screenshot data saved to /tmp/fitforge_screenshot.json"
else
    echo "Could not get tab ID for screenshot"
fi

echo "🎯 Chrome should now be showing FitForge production site"
echo "URL: https://fitforge-free-9zezd.ondigitalocean.app"