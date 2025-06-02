#!/usr/bin/env python3
"""
Simple script to check FitForge production site
"""

import json
import subprocess
import time
import base64
import os

def run_powershell(command):
    """Execute PowerShell command from WSL"""
    try:
        result = subprocess.run(
            ['powershell.exe', '-Command', command],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def start_chrome():
    """Start Chrome with debugging enabled"""
    chrome_cmd = '''
    $chromeProcess = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
    if ($chromeProcess) {
        $chromeProcess | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
    Start-Process -FilePath "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" -ArgumentList "--remote-debugging-port=9222", "--new-window", "--disable-web-security", "--user-data-dir=C:\\temp\\chrome_debug"
    '''
    stdout, stderr, code = run_powershell(chrome_cmd)
    return code == 0

def send_chrome_command(command, tab_id=None):
    """Send command to Chrome DevTools"""
    if tab_id:
        url = f"http://localhost:9222/runtime/evaluate"
        data = {"expression": command, "returnByValue": True}
    else:
        url = f"http://localhost:9222/json"
        data = None
    
    curl_cmd = f'curl -s "{url}"'
    if data:
        curl_cmd += f" -H 'Content-Type: application/json' -d '{json.dumps(data)}'"
    
    stdout, stderr, code = run_powershell(curl_cmd)
    if code == 0:
        try:
            return json.loads(stdout)
        except:
            return stdout
    return None

def main():
    print("Starting Chrome with debugging...")
    if not start_chrome():
        print("Failed to start Chrome")
        return
    
    time.sleep(3)
    
    print("Getting Chrome tabs...")
    tabs = send_chrome_command("")
    if not tabs:
        print("Failed to get tabs")
        return
    
    print(f"Found {len(tabs)} tabs")
    
    # Create new tab
    stdout, stderr, code = run_powershell('curl -s "http://localhost:9222/json/new"')
    if code != 0:
        print("Failed to create new tab")
        return
    
    try:
        new_tab = json.loads(stdout)
        tab_id = new_tab['id']
        print(f"Created new tab: {tab_id}")
    except:
        print("Failed to parse new tab response")
        return
    
    # Navigate to FitForge
    navigate_cmd = f'curl -s "http://localhost:9222/json/runtime/evaluate" -H "Content-Type: application/json" -d \'{{"expression": "window.location.href = \\"https://fitforge-free-9zezd.ondigitalocean.app\\"", "returnByValue": true}}\''
    stdout, stderr, code = run_powershell(navigate_cmd)
    print("Navigating to FitForge...")
    
    time.sleep(5)
    
    # Get page info
    get_title_cmd = f'curl -s "http://localhost:9222/json/runtime/evaluate" -H "Content-Type: application/json" -d \'{{"expression": "document.title", "returnByValue": true}}\''
    stdout, stderr, code = run_powershell(get_title_cmd)
    if code == 0:
        try:
            result = json.loads(stdout)
            if 'result' in result and 'value' in result['result']:
                print(f"Page title: {result['result']['value']}")
        except:
            pass
    
    # Get page content
    get_content_cmd = f'curl -s "http://localhost:9222/json/runtime/evaluate" -H "Content-Type: application/json" -d \'{{"expression": "document.body.innerText.substring(0, 1000)", "returnByValue": true}}\''
    stdout, stderr, code = run_powershell(get_content_cmd)
    if code == 0:
        try:
            result = json.loads(stdout)
            if 'result' in result and 'value' in result['result']:
                print("Page content (first 1000 chars):")
                print(result['result']['value'])
        except:
            pass
    
    # Take screenshot
    screenshot_cmd = f'curl -s "http://localhost:9222/json/runtime/evaluate" -H "Content-Type: application/json" -d \'{{"expression": "document.documentElement.scrollHeight", "returnByValue": true}}\''
    stdout, stderr, code = run_powershell(screenshot_cmd)
    
    # Take actual screenshot
    take_screenshot_cmd = f'curl -s "http://localhost:9222/page/captureScreenshot" -H "Content-Type: application/json" -d \'{{"format": "png", "quality": 80}}\''
    stdout, stderr, code = run_powershell(take_screenshot_cmd)
    if code == 0:
        try:
            result = json.loads(stdout)
            if 'data' in result:
                screenshot_data = base64.b64decode(result['data'])
                screenshot_path = f"/tmp/fitforge_screenshot_{int(time.time())}.png"
                with open(screenshot_path, 'wb') as f:
                    f.write(screenshot_data)
                print(f"Screenshot saved to: {screenshot_path}")
        except Exception as e:
            print(f"Failed to save screenshot: {e}")

if __name__ == "__main__":
    main()