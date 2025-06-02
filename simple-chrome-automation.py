#!/usr/bin/env python3
"""Simple Chrome Automation - Normal Usage"""

from wsl_chrome_mcp import WSLChromeAutomation
import time

def navigate_to_url(url: str):
    """Simple function to navigate to a URL"""
    chrome = WSLChromeAutomation()
    
    # Start Chrome if needed
    chrome.start_chrome()
    time.sleep(2)
    
    # Create tab with URL
    tab = chrome.create_tab(url)
    print(f"Opened: {url}")
    return tab

def list_all_tabs():
    """List all open tabs"""
    chrome = WSLChromeAutomation()
    tabs = chrome.list_tabs()
    
    for i, tab in enumerate(tabs):
        print(f"Tab {i+1}: {tab.get('title', 'Unknown')} - {tab.get('url', 'Unknown')}")
    
    return tabs

if __name__ == "__main__":
    # Example usage
    navigate_to_url("https://github.com/punkpeye/awesome-mcp-servers")
    time.sleep(1)
    list_all_tabs()