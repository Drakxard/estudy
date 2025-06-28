// electron-main.js

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import path from 'path';
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';

function createWindow() {
  // para obtener __dirname en ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname  = path.dirname(__filename);

  // determina preload en prod (desempaquetado) o dev
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'preload.js')
    : path.join(__dirname, 'preload.js');

  const win = new BrowserWindow({
    width: 800, height: 600, show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'server', 'public', 'index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }

  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Carga fallida:', code, desc);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
