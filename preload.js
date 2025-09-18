const { contextBridge, ipcRenderer } = require('electron');

// 暴露 MainProcess API 給外部調用
contextBridge.exposeInMainWorld('electronAPI', {
  switchPage: (pageName) => {
    console.log('Preload: Switching to page:', pageName);
    ipcRenderer.invoke('switch-page', pageName);
  }
});

console.log('Preload script loaded');