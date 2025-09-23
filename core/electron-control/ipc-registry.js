const { ipcMain } = require('electron');

function registerAllIPC(windowManager) {
  console.log('Registering all IPC handlers...');

  // #region 配置相關 IPC
  ipcMain.handle('load-config', async () => {
    try {
      // 這裡可以從 windowManager 或其他地方載入配置
      // 假設 windowManager 有 getConfig 方法
      if (windowManager.getConfig) {
        return await windowManager.getConfig();
      }
      
      // 或者直接載入配置檔案
      const config = require('../../client.config'); // 根據你的配置檔案路徑調整
      return config;
    } catch (error) {
      console.error('載入配置失敗:', error);
      return null;
    }
  });
  // #endregion

  // #region 側邊欄相關 IPC
  ipcMain.handle('switch-view', (event, webContentsId) => {
    try {
      console.log('IPC switch-view:', webContentsId);
      const isSuccess = windowManager.switchMainWCV(webContentsId);
      return { success: isSuccess, currentView: webContentsId };
    } catch (error) {
      console.error('切換視圖失敗:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resize-sidebar', (event, newWidth) => {
    try {
      console.log('IPC: 調整側邊欄寬度:', newWidth);
      
      // 設定寬度限制
      const minWidth = 150;
      const maxWidth = 400;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      if (windowManager.resizeSidebar) {
        windowManager.resizeSidebar(clampedWidth);
        return { success: true, width: clampedWidth };
      }
      
      return { success: false, error: '方法不存在' };
    } catch (error) {
      console.error('調整側邊欄寬度失敗:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-sidebar-width', () => {
    try {
      return windowManager.getSidebarWidth();
    } catch (error) {
      console.error('獲取側邊欄寬度失敗使用預設寬度200:', error);
      return 200;
    }
  });
  // #endregion

  // #region 事件發送輔助方法
  /**
   * 發送側邊欄更新通知
   * @param {Object} data - 更新數據
   */
  function sendSidebarUpdate(data) {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.mainWindow.webContents.send('sidebar-update', data);
    }
  }

  /**
   * 發送配置變更通知
   * @param {Object} config - 新配置
   */
  function sendConfigChange(config) {
    if (windowManager.mainWindow && !windowManager.mainWindow.isDestroyed()) {
      windowManager.mainWindow.webContents.send('config-changed', config);
    }
  }

  // 將輔助方法綁定到 windowManager，方便其他地方調用
  if (windowManager) {
    windowManager.sendSidebarUpdate = sendSidebarUpdate;
    windowManager.sendConfigChange = sendConfigChange;
  }
  // #endregion

  // #region 清理資源
  const cleanup = () => {
    console.log('🧹 Cleaning up IPC handlers...');
    ipcMain.removeAllListeners('load-config');
    ipcMain.removeAllListeners('switch-view');
    ipcMain.removeAllListeners('resize-sidebar');
    ipcMain.removeAllListeners('get-sidebar-width');
  };

  // 應用退出時清理
  const { app } = require('electron');
  app.on('before-quit', cleanup);
  // #endregion

  console.log('✅ All IPC handlers registered successfully');
  
  return {
    cleanup,
    sendSidebarUpdate,
    sendConfigChange
  };
}

module.exports = { registerAllIPC };