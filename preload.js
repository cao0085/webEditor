const { contextBridge, ipcRenderer } = require('electron');

// 暴露 MainProcess API 給外部調用
contextBridge.exposeInMainWorld('electronAPI', {
  switchPage: (pageName) => {
    console.log('Preload: Switching to page:', pageName);
    ipcRenderer.invoke('switch-page', pageName);
  },

  // 側邊欄寬度調整 API
  resizeSidebar: (newWidth) => {
    return ipcRenderer.invoke('resize-sidebar', newWidth);
  },

  getSidebarWidth: () => {
    return ipcRenderer.invoke('get-sidebar-width');
  }
});

console.log('Preload script loaded');