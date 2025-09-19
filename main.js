const { app, ipcMain } = require('electron');
const WindowManager = require('./core/windowManager');
const { WCV_DEFAULT_SETTING } = require('./client.config.js');
const { registerAllIPC } = require('./core/ipc-registry.js');

let windowManager = null;

app.whenReady().then(async () => {
  console.log('App is ready, creating main window...');
  try {
    windowManager = new WindowManager();
    const ipcUtils = registerAllIPC(windowManager);
    await windowManager.initialize(WCV_DEFAULT_SETTING);
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error creating main window:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

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

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});