import { contextBridge, ipcRenderer } from 'electron';

// API segura para el renderer
const electronAPI = {
  // Información de la aplicación
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Diálogos
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Enlaces externos
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Eventos del menú
  onNewConversation: (callback) => {
    ipcRenderer.on('new-conversation', callback);
    return () => ipcRenderer.removeListener('new-conversation', callback);
  },
  
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  },
  
  onResetStudentData: (callback) => {
    ipcRenderer.on('reset-student-data', callback);
    return () => ipcRenderer.removeListener('reset-student-data', callback);
  },
  
  // Utilidades
  platform: process.platform,
  isElectron: true,
  
  // Configuración
  isDev: process.env.NODE_ENV === 'development'
};

// Exponer API al contexto del renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Configuración adicional para desarrollo
if (process.env.NODE_ENV === 'development') {
  // Habilitar herramientas de desarrollo
  window.addEventListener('DOMContentLoaded', () => {
    console.log('Mora Electron App - Modo Desarrollo');
  });
}

// Manejo de errores
window.addEventListener('error', (error) => {
  console.error('Error en renderer:', error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rechazada:', event.reason);
});