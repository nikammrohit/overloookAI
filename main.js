const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

let mainWindow;

app.whenReady().then(() => {
  createWindow();

  // Register global hotkey (Command+B to toggle overlay)
  globalShortcut.register('Command+B', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // Register global shortcuts for moving the window
  globalShortcut.register('Command+Up', () => moveWindow(0, -50));
  globalShortcut.register('Command+Down', () => moveWindow(0, 50));
  globalShortcut.register('Command+Left', () => moveWindow(-50, 0));
  globalShortcut.register('Command+Right', () => moveWindow(50, 0));

  // Register global hotkey (Command+H to take a screenshot and send it to the backend)
  globalShortcut.register('Command+H', async () => {
    try {
      const img = await screenshot();
      const filePath = path.join(app.getPath('temp'), 'screenshot.png');
      fs.writeFileSync(filePath, img);

      console.log('Screenshot saved at:', filePath);

      const formData = new FormData();
      formData.append('screenshot', fs.createReadStream(filePath));

      const response = await axios.post('http://localhost:3000/api/solve', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      console.log('Solution received from backend:', response.data.solution);
      mainWindow.webContents.send('solution-received', response.data.solution);

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Failed to process screenshot:', error.message || error);
      mainWindow.webContents.send('solution-error', error.message || 'Failed to process screenshot');
    }
  });

  // Add IPC handler to read files
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const fileData = await fs.promises.readFile(filePath);
      return fileData.toString('base64'); // Return file data as a base64 string
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error; // Send the error back to the renderer process
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.center();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(`file://${path.join(__dirname, '/frontend/dist/index.html')}`);
}

function moveWindow(xOffset, yOffset) {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({
      x: bounds.x + xOffset,
      y: bounds.y + yOffset,
      width: bounds.width,
      height: bounds.height,
    });
  }
}