const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Workout controls
  onNewWorkout: (callback) => ipcRenderer.on('new-workout', callback),
  onStartWorkout: (callback) => ipcRenderer.on('start-workout', callback),
  onPauseWorkout: (callback) => ipcRenderer.on('pause-workout', callback),
  
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // File operations (for future use)
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Notifications (for future use)
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body)
});

// Remove loading screen once page loads
window.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
});