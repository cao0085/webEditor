const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染進程
contextBridge.exposeInMainWorld('electronAPI', {
  // 切換頁面
  switchPage: (pageName) => {
    console.log('Preload: Switching to page:', pageName);
    ipcRenderer.invoke('switch-page', pageName);
  }
});

console.log('Preload script loaded');