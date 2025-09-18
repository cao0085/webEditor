const { BrowserWindow, WebContentsView, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.sidebarView = null; // 側邊欄 view
    this.contentView = null; // 內容區 view
    this.contentViews = new Map(); // 儲存所有內容頁面的 WebContentsView
    this.currentPageName = null;
    this.sidebarWidth = 200; // 側邊欄寬度
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
        preload: path.join(__dirname, '..', 'preload.js')
      },
      show: true  // 直接顯示視窗
    });

    console.log('🪟 BrowserWindow created and shown');

    // 初始化雙 view 架構
    this.initializeViews();

    // 創建選單
    this.createMenu();

    this.mainWindow.on('closed', () => {
      console.log('🔒 Window closed');
      this.mainWindow = null;
      this.sidebarView = null;
      this.contentView = null;
      this.contentViews.clear();
      this.currentPageName = null;
    });

    return this.mainWindow;
  }

  initializeViews() {
    console.log('🔧 Initializing dual view architecture...');
    
    // 創建側邊欄 WebContentsView
    this.sidebarView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'preload.js')
      }
    });

    // 載入側邊欄 HTML
    const sidebarPath = path.join(__dirname, 'testRender', 'sidebar.html');
    this.sidebarView.webContents.loadFile(sidebarPath);

    // 添加側邊欄到主視窗
    this.mainWindow.contentView.addChildView(this.sidebarView);

    // 載入預設內容頁面
    this.loadContentPage('page01.html');

    // 設置初始佈局
    this.updateViewBounds();

    // 監聽視窗大小改變
    this.mainWindow.on('resize', () => {
      this.updateViewBounds();
    });

    console.log('✅ Dual view architecture initialized');
  }

  loadContentPage(filename) {
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

    // 隱藏當前顯示的內容 view
    if (this.contentView) {
      console.log('👁️ Hiding current content view');
      this.contentView.setVisible(false);
    }

    // 檢查是否已經有這個頁面的 view
    if (this.contentViews.has(filename)) {
      console.log('♻️ Reusing existing content view for this page');
      this.contentView = this.contentViews.get(filename);
      this.currentPageName = filename;
      
      // 顯示這個 view
      this.contentView.setVisible(true);
      this.updateViewBounds();
      return;
    }

    // 創建新的內容 WebContentsView
    console.log('🆕 Creating new content WebContentsView');
    const newContentView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // 監聽 WebContentsView 的載入事件
    newContentView.webContents.once('did-finish-load', () => {
      console.log('✅ Content WebContentsView finished loading');
    });

    newContentView.webContents.once('dom-ready', () => {
      console.log('✅ Content WebContentsView DOM ready');
    });

    // 將 view 添加到主視窗
    console.log('➕ Adding content view to main window');
    this.mainWindow.contentView.addChildView(newContentView);

    // 設定 view 的邊界
    this.contentView = newContentView;
    this.currentPageName = filename;
    this.contentViews.set(filename, newContentView);
    this.updateViewBounds();

    // 載入 HTML 檔案
    console.log(`📂 Loading HTML file: ${htmlPath}`);
    newContentView.webContents.loadFile(htmlPath)
      .then(() => {
        console.log('✅ HTML file loaded successfully');
      })
      .catch((error) => {
        console.error('❌ Error loading HTML file:', error);
      });
  }

  // 保持向後兼容性的方法
  loadPage(filename) {
    this.loadContentPage(filename);
  }

  updateViewBounds() {
    if (this.mainWindow) {
      const bounds = this.mainWindow.getContentBounds();
      console.log(`📏 Updating view bounds: ${bounds.width}x${bounds.height}`);
      
      // 設置側邊欄邊界
      if (this.sidebarView) {
        this.sidebarView.setBounds({
          x: 0,
          y: 0,
          width: this.sidebarWidth,
          height: bounds.height
        });
      }
      
      // 設置內容區邊界
      if (this.contentView) {
        this.contentView.setBounds({
          x: this.sidebarWidth,
          y: 0,
          width: bounds.width - this.sidebarWidth,
          height: bounds.height
        });
      }
      
      // 更新所有內容 view 的邊界
      this.contentViews.forEach((view) => {
        view.setBounds({
          x: this.sidebarWidth,
          y: 0,
          width: bounds.width - this.sidebarWidth,
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