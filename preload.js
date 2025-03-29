const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onScreenshotTaken: (callback) => ipcRenderer.on('screenshot-taken', (event, filePath) => callback(filePath)),
});