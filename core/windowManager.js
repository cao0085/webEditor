const { BrowserWindow, WebContentsView, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.currentView = null;
    this.views = new Map(); // 儲存所有的 WebContentsView
    this.currentPageName = null;
    console.log('🏗️ WindowManager constructed');
  }

  createMainWindow() {
    console.log('🪟 Creating main window...');
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
      },
      show: true  // 直接顯示視窗
    });

    console.log('🪟 BrowserWindow created and shown');

    // 載入預設頁面
    this.loadPage('page01.html');

    // 創建選單
    this.createMenu();

    this.mainWindow.on('closed', () => {
      console.log('🔒 Window closed');
      this.mainWindow = null;
      this.currentView = null;
      this.views.clear();
      this.currentPageName = null;
    });

    return this.mainWindow;
  }

  loadPage(filename) {
    console.log(`📄 Loading page: ${filename}`);
    
    if (!this.mainWindow) {
      console.error('❌ No main window available');
      return;
    }

    // 檢查檔案是否存在
    const htmlPath = path.join(__dirname, 'testRender', filename);
    console.log(`🔍 Looking for HTML file at: ${htmlPath}`);
    
    if (!fs.existsSync(htmlPath)) {
      console.error(`❌ HTML file not found: ${htmlPath}`);
      return;
    }
    console.log('✅ HTML file exists');

    // 如果已經是當前頁面，不需要切換
    if (this.currentPageName === filename) {
      console.log('ℹ️ Already on this page, no need to switch');
      return;
    }

    // 隱藏當前顯示的 view
    if (this.currentView) {
      console.log('👁️ Hiding current view');
      this.currentView.setVisible(false);
    }

    // 檢查是否已經有這個頁面的 view
    if (this.views.has(filename)) {
      console.log('♻️ Reusing existing view for this page');
      this.currentView = this.views.get(filename);
      this.currentPageName = filename;
      
      // 顯示這個 view
      this.currentView.setVisible(true);
      this.updateViewBounds();
      return;
    }

    // 創建新的 WebContentsView
    console.log('🆕 Creating new WebContentsView');
    const newView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // 監聽 WebContentsView 的載入事件
    newView.webContents.once('did-finish-load', () => {
      console.log('✅ WebContentsView finished loading');
    });

    newView.webContents.once('dom-ready', () => {
      console.log('✅ WebContentsView DOM ready');
    });

    // 將 view 添加到主視窗
    console.log('➕ Adding view to main window');
    this.mainWindow.contentView.addChildView(newView);

    // 設定 view 的邊界
    this.currentView = newView;
    this.currentPageName = filename;
    this.views.set(filename, newView);
    this.updateViewBounds();

    // 載入 HTML 檔案
    console.log(`📂 Loading HTML file: ${htmlPath}`);
    newView.webContents.loadFile(htmlPath)
      .then(() => {
        console.log('✅ HTML file loaded successfully');
      })
      .catch((error) => {
        console.error('❌ Error loading HTML file:', error);
      });

    // 監聽視窗大小改變
    this.mainWindow.removeAllListeners('resize');
    this.mainWindow.on('resize', () => {
      this.updateViewBounds();
    });
  }

  updateViewBounds() {
    if (this.mainWindow) {
      const bounds = this.mainWindow.getContentBounds();
      console.log(`📏 Updating view bounds: ${bounds.width}x${bounds.height}`);
      
      // 更新所有 view 的邊界
      this.views.forEach((view) => {
        view.setBounds({
          x: 0,
          y: 0,
          width: bounds.width,
          height: bounds.height
        });
      });
    }
  }

  createMenu() {
    console.log('📋 Creating menu');
    
    const template = [
      {
        label: '檔案',
        submenu: [
          {
            label: '載入 Page 1',
            click: () => this.loadPage('page01.html')
          },
          {
            label: '載入 Page 2',
            click: () => this.loadPage('page02.html')
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.close();
              }
            }
          }
        ]
      },
      {
        label: '開發工具',
        submenu: [
          {
            label: '開啟開發者工具',
            accelerator: 'F12',
            click: () => {
              if (this.currentView) {
                this.currentView.webContents.openDevTools();
              }
            }
          },
          {
            label: '重新載入',
            accelerator: 'F5',
            click: () => {
              if (this.currentView) {
                this.currentView.webContents.reload();
              }
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    console.log('✅ Menu created');
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getCurrentView() {
    return this.currentView;
  }

  closeAllWindows() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }
}

module.exports = WindowManager;