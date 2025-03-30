const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Listen for the screenshot-taken event
  onScreenshotTaken: (callback) => ipcRenderer.on('screenshot-taken', (event, filePath) => callback(filePath)),

  // Listen for the solution-received event
  onSolutionReceived: (callback) => ipcRenderer.on('solution-received', (event, solution) => callback(solution)),

  // Listen for the solution-error event
  onSolutionError: (callback) => ipcRenderer.on('solution-error', (event, error) => callback(error)),

  // Expose the readFile method to read files from the main process
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});