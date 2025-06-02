#!/usr/bin/env python3
"""Check FitForge Production Debug Information"""

import sys
import os
import time
import json

# Import the WSL Chrome automation
try:
    from wsl_chrome_mcp import WSLChromeAutomation
except ImportError:
    print("❌ wsl_chrome_mcp not available. Using simple curl approach...")
    import subprocess
    
    def check_with_curl():
        """Fallback method using curl to check the site"""
        try:
            # Get the HTML content
            result = subprocess.run(['curl', '-s', 'https://fitforge-free-9zezd.ondigitalocean.app'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                html = result.stdout
                print("✅ Site is accessible")
                print(f"HTML length: {len(html)} characters")
                
                # Check for React indicators
                if '<div id="root">' in html:
                    print("✅ React root div found")
                else:
                    print("❌ React root div not found")
                
                # Check for JavaScript files
                if '/assets/' in html and '.js' in html:
                    print("✅ JavaScript assets found")
                else:
                    print("❌ No JavaScript assets found")
                
                # Show the HTML structure
                print(f"\nHTML Content Preview:")
                print(html[:1000])
                
            else:
                print(f"❌ Failed to fetch site: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error with curl: {e}")
    
    # Use fallback
    check_with_curl()
    sys.exit(0)

def check_fitforge_debug():
    """Navigate to FitForge and check debug information"""
    chrome = WSLChromeAutomation()
    
    try:
        # Start Chrome if needed
        print("Starting Chrome...")
        chrome.start_chrome()
        time.sleep(3)
        
        # Navigate to FitForge
        url = "https://fitforge-free-9zezd.ondigitalocean.app"
        print(f"Navigating to {url}...")
        tab = chrome.create_tab(url)
        
        if not tab:
            print("❌ Failed to create tab")
            return
            
        tab_id = tab['id']
        print(f"✅ Tab created: {tab_id}")
        
        # Wait for page to load
        print("Waiting for page to load...")
        time.sleep(5)
        
        # Get page content
        print("Getting page content...")
        result = chrome.evaluate_js(tab_id, "document.title")
        print(f"Page title: {result}")
        
        # Check if React root exists
        root_check = chrome.evaluate_js(tab_id, "document.getElementById('root') ? 'Root exists' : 'No root found'")
        print(f"React root: {root_check}")
        
        # Look for debug component content
        debug_content = chrome.evaluate_js(tab_id, """
            const debugElement = document.querySelector('h1, h2, h3, [data-testid]');
            if (debugElement) {
                return debugElement.textContent || debugElement.innerText;
            }
            return 'No debug element found';
        """)
        print(f"Debug content: {debug_content}")
        
        # Check for environment variables in the page
        env_check = chrome.evaluate_js(tab_id, """
            // Look for any text containing VITE_ or environment info
            const bodyText = document.body.innerText || '';
            const hasViteVars = bodyText.includes('VITE_') || bodyText.includes('Environment');
            return {
                hasEnvVars: hasViteVars,
                bodyLength: bodyText.length,
                containsVite: bodyText.includes('VITE_SUPABASE'),
                sample: bodyText.substring(0, 200)
            };
        """)
        print(f"Environment check: {json.dumps(env_check, indent=2)}")
        
        # Check console for errors
        console_logs = chrome.evaluate_js(tab_id, """
            // Get any error messages from console if possible
            return window.console ? 'Console exists' : 'No console access';
        """)
        print(f"Console access: {console_logs}")
        
        # Get all text content from body
        body_content = chrome.evaluate_js(tab_id, "document.body.innerText || document.body.textContent || 'No body content'")
        print(f"Body content preview: {body_content[:500]}...")
        
        print("\n✅ Debug check completed!")
        
    except Exception as e:
        print(f"❌ Error during debug check: {e}")
        
    finally:
        # List all tabs for reference
        try:
            tabs = chrome.list_tabs()
            print(f"\nOpen tabs: {len(tabs)}")
            for i, tab in enumerate(tabs):
                print(f"  {i+1}. {tab.get('title', 'Unknown')} - {tab.get('url', 'Unknown')[:50]}...")
        except:
            pass

if __name__ == "__main__":
    check_fitforge_debug()