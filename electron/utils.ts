import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if the app is running in development mode
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

/**
 * Get the app's resource path
 */
export function getResourcePath(): string {
  if (isDev()) {
    return path.join(__dirname, '..');
  }
  return process.resourcesPath;
}

/**
 * Get the user data directory for storing app data
 */
export function getUserDataPath(): string {
  return app.getPath('userData');
}

/**
 * Get the path to the built frontend files
 */
export function getDistPath(): string {
  return path.join(getResourcePath(), 'dist', 'public');
}

/**
 * Get the path for app icons
 */
export function getIconPath(): string {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  return path.join(getResourcePath(), 'build', iconName);
}

/**
 * Check if we're running on macOS
 */
export function isMac(): boolean {
  return process.platform === 'darwin';
}

/**
 * Check if we're running on Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Check if we're running on Linux
 */
export function isLinux(): boolean {
  return process.platform === 'linux';
}