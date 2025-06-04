// Stagewise Toolbar - Portable version for any localhost project
// Features: Element selection, context generation, MCP bridge integration

(function() {
    'use strict';
    
    console.log('🚀 Stagewise toolbar loading...', window.location.href);
    
    // Configuration - can be overridden
    const CONFIG = {
        mcpServerUrl: 'http://172.22.206.209:3001',
        toolbar: {
            position: { top: '20px', right: '20px' },
            maxWidth: '350px',
            minWidth: '320px'
        },
        element: {
            highlightColor: '#ff6b6b',
            highlightOpacity: 0.1
        }
    };
    
    // State management
    let selectedElement = null;
    let runningDoc = [];
    let runningDocText = '';
    let mcpConnected = false;
    
    // Enhanced styles - portable and self-contained
    const addStyles = () => {
        if (document.getElementById('stagewise-toolbar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'stagewise-toolbar-styles';
        style.textContent = `
            .stagewise-selected {
                outline: 3px solid ${CONFIG.element.highlightColor} !important;
                outline-offset: 2px !important;
                background-color: rgba(255, 107, 107, ${CONFIG.element.highlightOpacity}) !important;
                animation: stagewise-pulse 2s infinite;
            }
            
            @keyframes stagewise-pulse {
                0%, 100% { outline-color: ${CONFIG.element.highlightColor}; }
                50% { outline-color: #ff9999; }
            }
            
            .stagewise-toolbar {
                position: fixed;
                top: ${CONFIG.toolbar.position.top};
                right: ${CONFIG.toolbar.position.right};
                background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                color: white;
                padding: 15px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                z-index: 10000;
                max-width: ${CONFIG.toolbar.maxWidth};
                min-width: ${CONFIG.toolbar.minWidth};
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                border: 1px solid #4a5568;
            }
            
            .stagewise-toolbar h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                color: #68d391;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .stagewise-toolbar textarea {
                width: 100%;
                height: 60px;
                margin: 8px 0;
                padding: 8px;
                border: 1px solid #4a5568;
                border-radius: 6px;
                background: #1a202c;
                color: white;
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                transition: border-color 0.2s;
                box-sizing: border-box;
            }
            
            .stagewise-toolbar textarea:focus {
                outline: none;
                border-color: #68d391;
                box-shadow: 0 0 0 2px rgba(104, 211, 145, 0.2);
            }
            
            .stagewise-toolbar button {
                background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                margin: 2px;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .stagewise-toolbar button:hover {
                background: linear-gradient(135deg, #2f855a 0%, #276749 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3);
            }
            
            .stagewise-toolbar button.secondary {
                background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            }
            
            .stagewise-toolbar button.secondary:hover {
                background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
            }
            
            .stagewise-toolbar button.danger {
                background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
            }
            
            .stagewise-toolbar button.danger:hover {
                background: linear-gradient(135deg, #c53030 0%, #9c2626 100%);
            }
            
            .stagewise-output {
                background: #0d1117;
                border: 2px solid #21262d;
                color: #7dd3fc;
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
                font-size: 11px;
                padding: 12px;
                margin: 8px 0;
                white-space: pre-wrap;
                max-height: 200px;
                overflow-y: auto;
                border-radius: 6px;
                user-select: all;
                cursor: text;
                line-height: 1.4;
            }
            
            .stagewise-output.highlighted {
                border-color: #68d391;
                box-shadow: 0 0 0 2px rgba(104, 211, 145, 0.3);
                background: #0f1419;
            }
            
            .doc-counter {
                font-size: 11px;
                color: #a0aec0;
                background: #2d3748;
                padding: 2px 6px;
                border-radius: 10px;
                margin-left: 8px;
            }
            
            .stagewise-status {
                font-size: 11px;
                color: #68d391;
                margin-bottom: 8px;
                padding: 4px 8px;
                background: rgba(104, 211, 145, 0.1);
                border-radius: 4px;
                border-left: 3px solid #68d391;
            }
            
            .mcp-status {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 8px;
                margin-left: auto;
            }
            
            .mcp-status.connected {
                background: rgba(104, 211, 145, 0.2);
                color: #68d391;
            }
            
            .mcp-status.disconnected {
                background: rgba(229, 62, 62, 0.2);
                color: #fc8181;
            }
        `;
        document.head.appendChild(style);
    };
    
    // Create toolbar UI
    const createToolbar = () => {
        const toolbar = document.createElement('div');
        toolbar.className = 'stagewise-toolbar';
        toolbar.innerHTML = `
            <h3>
                🎯 Stagewise
                <span class="doc-counter" id="doc-count">0</span>
                <span class="mcp-status disconnected" id="mcp-status">MCP</span>
            </h3>
            <div id="status" class="stagewise-status" style="display: none;">Ready</div>
            <div id="element-info">Click any element to start</div>
            <textarea id="prompt-input" placeholder="Describe the change you want (Enter to add)"></textarea>
            <div style="display: flex; gap: 4px; margin: 4px 0;">
                <button onclick="window.Stagewise.showContext()" style="flex: 1;">📋 Show</button>
                <button onclick="window.Stagewise.sendToMCP()" style="flex: 1;">🚀 Send</button>
                <button onclick="window.Stagewise.addToDoc()" style="flex: 1;">➕ Add</button>
            </div>
            <div style="display: flex; gap: 4px; margin: 4px 0;">
                <button onclick="window.Stagewise.copyAll()" style="flex: 1;">📋 Copy All</button>
                <button onclick="window.Stagewise.sendAllToMCP()" style="flex: 1;">🚀 Send All</button>
                <button onclick="window.Stagewise.clear()" class="danger" style="flex: 0.8;">🗑️</button>
            </div>
            <div style="display: flex; gap: 4px; margin: 4px 0;">
                <button onclick="window.Stagewise.clearDoc()" class="secondary" style="flex: 1;">🗂️ Clear Doc</button>
                <button onclick="window.Stagewise.testMCP()" class="secondary" style="flex: 1;">🔧 Test MCP</button>
            </div>
            <div id="context-output" class="stagewise-output" style="display: none;"></div>
            <div id="running-doc" class="stagewise-output" style="max-height: 150px; display: none;"></div>
        `;
        document.body.appendChild(toolbar);
    };
    
    // Element click handler
    const handleClick = (event) => {
        if (event.target.closest('.stagewise-toolbar')) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        // Clear previous selection
        document.querySelectorAll('.stagewise-selected').forEach(el => {
            el.classList.remove('stagewise-selected');
        });
        
        // Select new element
        selectedElement = event.target;
        selectedElement.classList.add('stagewise-selected');
        
        // Update info display
        updateElementInfo();
        
        // Focus textarea for immediate input
        const textarea = document.getElementById('prompt-input');
        if (textarea) {
            textarea.focus({ preventScroll: true });
        }
        
        showStatus('Element selected - describe your change');
    };
    
    // Update element info display
    const updateElementInfo = () => {
        const info = document.getElementById('element-info');
        if (!info || !selectedElement) return;
        
        const tagName = selectedElement.tagName.toLowerCase();
        const id = selectedElement.id ? `#${selectedElement.id}` : '';
        const className = selectedElement.className ? `.${selectedElement.className.split(' ')[0]}` : '';
        info.innerHTML = `<strong>Selected:</strong> ${tagName}${id}${className}`;
    };
    
    // Generate context string
    const generateContext = () => {
        if (!selectedElement) return 'No element selected';
        
        const prompt = document.getElementById('prompt-input')?.value || 'No request specified';
        const selector = selectedElement.id ? `#${selectedElement.id}` : 
                        selectedElement.className ? `.${selectedElement.className.split(' ')[0]}` :
                        selectedElement.tagName.toLowerCase();
        
        const timestamp = new Date().toLocaleTimeString();
        
        const context = `STAGEWISE CONTEXT [${timestamp}]:

User Request: ${prompt}

Element: ${selectedElement.tagName.toLowerCase()}
Selector: ${selector}
ID: ${selectedElement.id || 'none'}
Classes: ${selectedElement.className || 'none'}
Text: ${selectedElement.textContent?.slice(0, 100) || 'none'}

Page: ${location.pathname.split('/').pop() || location.pathname}
URL: ${location.href}

HTML:
${selectedElement.outerHTML.slice(0, 300)}

TASK: Implement the user's request for this element.`;

        return context;
    };
    
    // Show status message
    const showStatus = (message, duration = 3000) => {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, duration);
        }
    };
    
    // Update document counter
    const updateDocCounter = () => {
        const counter = document.getElementById('doc-count');
        if (counter) {
            counter.textContent = runningDoc.length;
        }
    };
    
    // Update MCP status indicator
    const updateMCPStatus = (connected) => {
        mcpConnected = connected;
        const status = document.getElementById('mcp-status');
        if (status) {
            status.className = `mcp-status ${connected ? 'connected' : 'disconnected'}`;
            status.textContent = connected ? 'MCP ✓' : 'MCP';
        }
    };
    
    // MCP Communication functions
    const sendToMCP = async (context) => {
        try {
            const response = await fetch(`${CONFIG.mcpServerUrl}/context`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    context: context,
                    timestamp: new Date().toISOString(),
                    page: location.href,
                    type: 'single'
                })
            });
            
            if (response.ok) {
                updateMCPStatus(true);
                return true;
            } else {
                updateMCPStatus(false);
                return false;
            }
        } catch (error) {
            console.log('MCP communication failed:', error);
            updateMCPStatus(false);
            return false;
        }
    };
    
    // Test MCP connection
    const testMCP = async () => {
        console.log('🔍 Testing MCP connection to:', CONFIG.mcpServerUrl);
        try {
            const response = await fetch(`${CONFIG.mcpServerUrl}/health`);
            const connected = response.ok;
            updateMCPStatus(connected);
            showStatus(connected ? '✅ MCP Server connected' : '❌ MCP Server unavailable');
            return connected;
        } catch (error) {
            console.error('🚨 Stagewise MCP connection error:', error);
            console.error('🔍 Error details:', error.message, error.stack);
            updateMCPStatus(false);
            showStatus(`❌ MCP Server error: ${error.message}`);
            return false;
        }
    };
    
    // Clipboard copy fallback
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (err) {
            console.error('Copy failed:', err);
            return false;
        }
    };
    
    // Keyboard event handler
    const handleKeyboard = (event) => {
        const textarea = document.getElementById('prompt-input');
        if (!textarea || document.activeElement !== textarea) return;
        
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (selectedElement && textarea.value.trim()) {
                window.Stagewise.addToDoc();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            window.Stagewise.clear();
        }
    };
    
    // Global API
    window.Stagewise = {
        // Show current context
        showContext: () => {
            const context = generateContext();
            const output = document.getElementById('context-output');
            if (output) {
                output.textContent = context;
                output.style.display = 'block';
                output.classList.add('highlighted');
                
                setTimeout(() => {
                    output.classList.remove('highlighted');
                }, 2000);
            }
            showStatus('Context displayed');
        },
        
        // Send current context to MCP server
        sendToMCP: async () => {
            if (!selectedElement) {
                showStatus('❌ Select an element first');
                return;
            }
            
            const prompt = document.getElementById('prompt-input')?.value?.trim();
            if (!prompt) {
                showStatus('❌ Enter a request first');
                return;
            }
            
            const context = generateContext();
            const success = await sendToMCP(context);
            
            if (success) {
                showStatus('✅ Sent to Claude Code via MCP');
            } else {
                showStatus('❌ MCP failed - check server');
            }
        },
        
        // Add current context to running document
        addToDoc: () => {
            if (!selectedElement) {
                showStatus('❌ Select an element first');
                return;
            }
            
            const prompt = document.getElementById('prompt-input')?.value?.trim();
            if (!prompt) {
                showStatus('❌ Enter a request first');
                return;
            }
            
            const context = generateContext();
            runningDoc.push(context);
            runningDocText = runningDoc.join('\n\n' + '='.repeat(50) + '\n\n');
            
            // Update display
            const docEl = document.getElementById('running-doc');
            if (docEl) {
                docEl.textContent = runningDocText;
                docEl.style.display = 'block';
                docEl.scrollTop = docEl.scrollHeight;
            }
            
            updateDocCounter();
            
            // Clear input for next item
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) promptInput.value = '';
            
            showStatus(`✅ Added to doc (${runningDoc.length} items)`);
        },
        
        // Copy all contexts to clipboard
        copyAll: async () => {
            if (runningDoc.length === 0) {
                showStatus('❌ No items in document');
                return;
            }
            
            const success = await copyToClipboard(runningDocText);
            if (success) {
                showStatus(`✅ Copied ${runningDoc.length} items to clipboard`);
            } else {
                showStatus('❌ Copy failed');
            }
        },
        
        // Send all contexts to MCP server
        sendAllToMCP: async () => {
            if (runningDoc.length === 0) {
                showStatus('❌ No items in document');
                return;
            }
            
            try {
                const response = await fetch(`${CONFIG.mcpServerUrl}/context`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        context: runningDocText,
                        timestamp: new Date().toISOString(),
                        page: location.href,
                        type: 'batch',
                        count: runningDoc.length
                    })
                });
                
                if (response.ok) {
                    updateMCPStatus(true);
                    showStatus(`✅ Sent ${runningDoc.length} items to Claude Code`);
                } else {
                    updateMCPStatus(false);
                    showStatus('❌ MCP batch send failed');
                }
            } catch (error) {
                updateMCPStatus(false);
                showStatus('❌ MCP server unavailable');
            }
        },
        
        // Clear current selection
        clear: () => {
            document.querySelectorAll('.stagewise-selected').forEach(el => {
                el.classList.remove('stagewise-selected');
            });
            selectedElement = null;
            
            const info = document.getElementById('element-info');
            if (info) info.textContent = 'Click any element to start';
            
            const prompt = document.getElementById('prompt-input');
            if (prompt) prompt.value = '';
            
            const output = document.getElementById('context-output');
            if (output) {
                output.style.display = 'none';
                output.classList.remove('highlighted');
            }
            
            showStatus('Selection cleared');
        },
        
        // Clear running document
        clearDoc: () => {
            runningDoc = [];
            runningDocText = '';
            const docEl = document.getElementById('running-doc');
            if (docEl) {
                docEl.style.display = 'none';
                docEl.textContent = '';
            }
            updateDocCounter();
            showStatus('🗂️ Document cleared');
        },
        
        // Test MCP connection
        testMCP: testMCP,
        
        // Get current state (for debugging)
        getState: () => ({
            selectedElement: selectedElement,
            runningDoc: runningDoc,
            mcpConnected: mcpConnected,
            config: CONFIG
        })
    };
    
    // Initialize system
    const init = () => {
        addStyles();
        createToolbar();
        
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyboard);
        
        // Test MCP connection on startup
        console.log('⏰ Starting MCP test in 1 second...');
        setTimeout(testMCP, 1000);
        
        console.log('✅ Stagewise Toolbar ready!');
        console.log('🎯 Workflow: Click → Type → Enter (add to doc) → Send to MCP');
        console.log('🚀 MCP Server:', CONFIG.mcpServerUrl);
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();