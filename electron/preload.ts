import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // File dialogs
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Platform info
  platform: process.platform,
  
  // Window controls (if needed)
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Theme handling
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  },
  
  // Workout data persistence (for offline functionality)
  saveWorkoutData: (data: any) => ipcRenderer.invoke('save-workout-data', data),
  loadWorkoutData: () => ipcRenderer.invoke('load-workout-data'),
  
  // Notification support
  showNotification: (title: string, body: string) => 
    ipcRenderer.invoke('show-notification', { title, body }),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      showSaveDialog: () => Promise<Electron.SaveDialogReturnValue>;
      showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;
      platform: string;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      saveWorkoutData: (data: any) => Promise<void>;
      loadWorkoutData: () => Promise<any>;
      showNotification: (title: string, body: string) => Promise<void>;
    };
  }
}