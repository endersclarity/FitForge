# 🚀 FitForge Flask Development Server - Bulletproof Setup

## 🎯 **What You Want: Set It and Forget It**

**One command to start. Auto-reload on every change. Runs until you shut down the computer.**

## 🔧 **Quick Start (Choose Your Style)**

### **Option 1: Simple Auto-Reload (Recommended)**
```bash
npm run dev
```
- ✅ **Auto-reloads** on every file change
- ✅ **Always accessible** at your WSL IP
- ✅ **Clear logging** with timestamps
- ✅ **Proper host binding** (0.0.0.0 for Windows access)

### **Option 2: Bulletproof with Crash Recovery**
```bash
npm run dev-stable
```
- ✅ Everything from Option 1 PLUS:
- ✅ **Auto-restart** if server crashes
- ✅ **Health monitoring** 
- ✅ **Persistent until shutdown**

### **Option 3: Advanced Process Management**
```bash
# Start server as background process
npm run server start

# Check if it's running
npm run server status

# View logs
npm run server logs

# Stop when done
npm run server stop
```

## 🌐 **Access Your App**

After starting, you'll see:
```
📍 Windows Access URL: http://172.22.206.209:5000
📍 Local Access URL: http://localhost:5000
```

**Use the Windows URL in your browser!**

## ⚡ **The Magic Explained**

### **What Makes This Different:**

1. **`tsx watch`**: Watches ALL files and auto-reloads instantly
2. **`HOST=0.0.0.0`**: Binds to all interfaces (WSL accessible from Windows)
3. **`--clear-screen=false`**: Preserves output history
4. **Crash Recovery**: Automatically restarts if something breaks
5. **Health Monitoring**: Checks server is actually responding

### **File Watching Covers:**
- ✅ All TypeScript/JavaScript files
- ✅ JSON configuration files  
- ✅ Server routes and API endpoints
- ✅ Database schemas and models

## 🛠️ **Troubleshooting Commands**

```bash
# Server not responding?
npm run server health

# Want to see what's happening?
npm run server follow

# Nuclear option (kill everything and restart)
npm run server restart

# Check if port 5000 is busy
lsof -i :5000
```

## 🎯 **Daily Workflow**

1. **Morning**: `npm run dev` 
2. **Code all day** - changes appear instantly
3. **Evening**: Ctrl+C to stop (or leave it running)

## 🔥 **Why This Solves Your Problems:**

- **No more manual restarts** after code changes
- **No more "why isn't this updating?"** - tsx watch catches everything
- **No more WSL networking issues** - HOST=0.0.0.0 fixes Windows access
- **No more crashes killing your flow** - auto-recovery built in
- **No more hunting for the right commands** - simple npm scripts

## ⚙️ **Technical Details (For Claude)**

```json
{
  "dev": "NODE_ENV=development HOST=0.0.0.0 PORT=5000 tsx watch --clear-screen=false server/index.ts",
  "dev-stable": "./run-flask-dev.sh",
  "server": "./flask-monitor.sh"
}
```

- **tsx watch**: TypeScript execution with file watching
- **HOST=0.0.0.0**: Bind to all network interfaces  
- **PORT=5000**: Standard Flask development port
- **--clear-screen=false**: Preserve console history
- **Background scripts**: Advanced process management with PID tracking

## 🎉 **Result: Zero-Friction Development**

When I make changes to your code:
1. ✅ **You instantly see them** (no refresh needed)
2. ✅ **Server never goes down** (unless you stop it)
3. ✅ **Always accessible** from Windows browser
4. ✅ **Clear logging** of what's happening

**One command. Set it and forget it. Just like you wanted.**