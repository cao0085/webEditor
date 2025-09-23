const { contextBridge, ipcRenderer } = require('electron');

// 暴露 MainProcess API 給外部調用
// 可當作 ValueObject 驗證
contextBridge.exposeInMainWorld('electronAPI', {

  // loadConfig: () => {
  //   return ipcRenderer.invoke('load-config');
  // },

  subscribeSidebarUpdates: (callback) => {
    ipcRenderer.on('update-sidebar', (event, data) => callback(data));
  },

  switchView: (webContentsId) => {
    if (!webContentsId) {
      return Promise.reject(new Error('webContentsId is required'));
    }
    return ipcRenderer.invoke('switch-view', webContentsId);
  },

  resizeSidebar: (newWidth) => {
    if (typeof newWidth !== 'number' || newWidth < 0) {
      return Promise.reject(new Error('Invalid width'));
    }
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