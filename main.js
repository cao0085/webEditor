const { app } = require('electron');
const WindowManager = require('./core/windowManager');

console.log('🚀 Starting Electron app...');

// 創建視窗管理器實例
const windowManager = new WindowManager();

// 應用程式準備就緒時創建視窗
app.whenReady().then(() => {
  console.log('✅ App is ready, creating main window...');
  try {
    windowManager.createMainWindow();
    console.log('✅ Main window created successfully');
  } catch (error) {
    console.error('❌ Error creating main window:', error);
  }
});

// 所有視窗關閉時的處理
app.on('window-all-closed', () => {
  console.log('🔒 All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 特有行為：點擊 dock 圖標時重新創建視窗
app.on('activate', () => {
  console.log('🎯 App activated');
  if (!windowManager.getMainWindow()) {
    windowManager.createMainWindow();
  }
});

// 應用程式即將退出
app.on('before-quit', () => {
  console.log('👋 App is quitting...');
  windowManager.closeAllWindows();
});

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});