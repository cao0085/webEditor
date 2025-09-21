const { contextBridge, ipcRenderer } = require('electron');

// 暴露 MainProcess API 給外部調用
contextBridge.exposeInMainWorld('electronAPI', {

  loadConfig: () => {
    return ipcRenderer.invoke('load-config');
  },

  onSidebarUpdate: (callback) => {
    ipcRenderer.on('update-sidebar', (event, data) => callback(data));
  },

  switchView: (webContentsID) => {
    return ipcRenderer.invoke('switch-view', webContentsID);
  },

  resizeSidebar: (newWidth) => {
    return ipcRenderer.invoke('resize-sidebar', newWidth);
  },

  getSidebarWidth: () => {
    return ipcRenderer.invoke('get-sidebar-width');
  },

  onConfigChange: (callback) => {
    ipcRenderer.on('config-changed', (event, config) => {
      callback(config);
    });
  },

  removeConfigListener: () => {
    ipcRenderer.removeAllListeners('config-changed');
  }
});

console.log('Preload script loaded');