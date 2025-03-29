const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const axios = require('axios'); // Import axios for HTTP requests
const FormData = require('form-data'); // Import FormData for multipart requests

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
  globalShortcut.register('Command+Up', () => moveWindow(0, -50)); // Move up
  globalShortcut.register('Command+Down', () => moveWindow(0, 50)); // Move down
  globalShortcut.register('Command+Left', () => moveWindow(-50, 0)); // Move left
  globalShortcut.register('Command+Right', () => moveWindow(50, 0)); // Move right

  // Register global hotkey (Command+H to take a screenshot and send it to the backend)
  globalShortcut.register('Command+H', async () => {
    try {
      const img = await screenshot(); // Capture the screen
      const filePath = path.join(app.getPath('temp'), 'screenshot.png');
      fs.writeFileSync(filePath, img); // Save the screenshot temporarily

      console.log('Screenshot saved at:', filePath);

      // Send the screenshot to the backend API
      const formData = new FormData();
      formData.append('screenshot', fs.createReadStream(filePath)); // Attach the screenshot file

      const response = await axios.post('http://localhost:3000/api/solve', formData, {
        headers: {
          ...formData.getHeaders(), // Set the correct headers for multipart/form-data
        },
      });

      console.log('Solution received from backend:', response.data.solution);

      // Send the solution to the renderer process
      mainWindow.webContents.send('solution-received', response.data.solution);

      // Delete the temporary screenshot file
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Failed to process screenshot:', error.message || error);

      // Send error message to the renderer process
      mainWindow.webContents.send('solution-error', error.message || 'Failed to process screenshot');
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
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000', // Fully transparent
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // Add preload script
    },
  });

  mainWindow.center();

  // Show the window when it's ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load React app in the frontend/dist directory
  mainWindow.loadURL(`file://${path.join(__dirname, '/frontend/dist/index.html')}`);
}

// Function to move the window
function moveWindow(xOffset, yOffset) {
  if (mainWindow) {
    const bounds = mainWindow.getBounds(); // Get current window bounds
    mainWindow.setBounds({
      x: bounds.x + xOffset,
      y: bounds.y + yOffset,
      width: bounds.width,
      height: bounds.height,
    });
  }
}