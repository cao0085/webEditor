const { app, ipcMain } = require('electron');
const WindowManager = require('./core/windowManager');
const windowManager = new WindowManager();
const { WebContentsView_Config } = require('./client.config.js');

// Init
// 應用程式準備就緒時創建視窗
app.whenReady().then(() => {
  console.log('App is ready, creating main window...');
  try {
    windowManager.createMainWindow(WebContentsView_Config);
    setupIPC(); // 設置 IPC 處理程序
  } catch (error) {
    console.error('Error creating main window:', error);
  }
});

// 所有視窗關閉時的處理
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS：點擊 dock 圖標時重新創建視窗
app.on('activate', () => {
  console.log('🎯 App activated');
  if (!windowManager.getMainWindow()) {
    windowManager.createMainWindow();
  }
});

// 應用程式即將退出
app.on('before-quit', () => {
  windowManager.closeAllWindows();
});

function setupIPC() {
  console.log('Setting up IPC handlers...');
  
  // 處理頁面切換請求
  ipcMain.handle('switch-page', async (event, pageName) => {
    console.log('IPC: Received switch-page request for:', pageName);
    const targetViewer = await windowManager.ensureWebContentView(pageName);
    windowManager.switchToView(targetViewer);
    return { success: true, page: pageName };
  });

  // 如果需要將配置傳給渲染進程
  ipcMain.handle('load-config', async () => {
    return {
      WebContentsView_Config
    };
  });
  
  console.log('IPC handlers set up successfully');
}





// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});