// Simple Electron launcher that avoids ES module issues
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    title: 'Mathematics Study Platform'
  });

  // Start server and load app
  console.log('Starting server...');
  const command = process.platform === 'win32' ? 'npm.cmd run build && npm.cmd start' : 'npm run build && npm start';
  
  serverProcess = exec(command, { cwd: path.join(__dirname) }, (error, stdout, stderr) => {
    if (error) {
      console.error('Server error:', error);
    }
  });

  // Wait for server and load URL
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.show();
  }, 5000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});