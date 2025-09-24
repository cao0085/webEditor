const { app, ipcMain } = require('electron');
const WindowManager = require('./core/windowManager');
const { WCV_DEFAULT_SETTING } = require('./client.config.js');
const { registerAllIPC } = require('./core/electron-control/ipc-registry.js');
const { validateAndThrow } = require('./core/validator/configValidator.js');
const { isLoggedIn, createLoginWindow, logout } = require('./core/auth.js');

// 引入 TypeScript 測試檔案（直接執行）
try {
  require('ts-node/register');
  require('./core/test.ts');
} catch (error) {
  console.log('TypeScript test execution error:', error.message);
}

let windowManager = null;

app.whenReady().then(async () => {
  createMainWindow();
  // const loggedIn = await isLoggedIn();
  // if (!loggedIn) {
  //   createLoginWindow();
  // } else {
  //   createMainWindow();
  // }
});

async function createMainWindow() {
  console.log('Creating main window...');
  try {
    validateAndThrow(WCV_DEFAULT_SETTING);
    windowManager = new WindowManager();
    const ipcUtils = registerAllIPC(windowManager);
    await windowManager.initialize(WCV_DEFAULT_SETTING);
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error during initialization:', error);
    app.quit();
  }
}

ipcMain.on('login-success', async () => {
  const Store = (await import('electron-store')).default;
  const store = new Store();
  store.set('isLoggedIn', true);

  const loginWindows = require('electron').BrowserWindow.getAllWindows();
  loginWindows.forEach(win => win.close());

  createMainWindow();
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
app.on('before-quit', async () => {
  await logout();
  if (windowManager) {
    windowManager.closeAllWindows();
  }
});

// 錯誤處理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});