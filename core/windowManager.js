const fs = require('fs');
const { BrowserWindow, WebContentsView, Menu } = require('electron');
const { SOURCE_TYPES, CONTENT_SOURCE } = require('./sourceManager');


class WindowManager {

    constructor() {
        this.mainWindow = null; // type BrowserWindow
        this.mainWebContentsView = null;  // type WebContentsView
        this.webContentsViewPool = new Map();   // 緩存已創建的 views
        this.sidebarWidth = 200;
    }

    createMainWindow() {

        // CREATE MAIN PROCESS
        console.log('Creating main window...');
        this.mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // 預設隔離作業系統
            contextIsolation: true, // 預設隔離作業系統
            enableRemoteModule: false,
            preload: path.join(__dirname, '..', 'preload.js')
        },
        show: true
        });

        // 監聽事件
        this.mainWindow.on('resize', () => {
            this.updateViewBounds();
        });

        this.mainWindow.on('closed', () => {
            console.log('🔒 Window closed');
            this.mainWindow = null;
            this.mainWebContentsView = null;
            this.webContentsViewPool.clear();
        });
        
        // CREATE RENDERER PROCESS
        const viewConfigs = [
            { key: 'SIDEBAR', instanceId: 'default', show: true },
            { key: 'EDITOR', instanceId: 'main', show: true },
            { key: 'PREVIEWER', instanceId: 'preview1', show: false },
            { key: 'PREVIEWER', instanceId: 'preview2', show: false }
        ];

        this.initializeViewsAsync(viewConfigs) // (不阻塞)

        // 創建選單
        this.createMenu();
        return this.mainWindow;
    }

    async initializeViewsAsync(viewConfigs) {
        try {
            // 檢查 showsViews 是否都在 renderKeys 中
            const results = await Promise.all(
                viewConfigs.map(config => 
                    this.ensureWebContentView(config.key, config.instanceId)
                )
            );

            if (!results.every(view => view !== null)) {
                throw new Error('Some views failed to load');
            }

            // 處理要顯示的 views
            viewConfigs.forEach((config, index) => {
                if (config.show && results[index]) {
                    const view = results[index];
                    this.mainWindow.contentView.addChildView(view);
                    view.setVisible(true);
                    if (config.key === 'EDITOR' && config.instanceId === 'main') {
                        this.mainWebContentsView = view;
                    }
                }
            });

            this.updateViewBounds();
            console.log('All views initialized successfully');
        } catch (error) {
            console.error('❌ Views initialization failed:', error);
        }
    }

    // 確保該 KEY 有對應 WebContentsView
    async ensureWebContentView(contentKey, instanceId = 'default') {

        if (!(contentKey in CONTENT_SOURCE)) {
            console.log(`UnDefine content: ${contentKey}`);
            return null;
        }

        // 檢查是否已存在 
        const {srcType, path, preload, singleton} = CONTENT_SOURCE[contentKey];
        const poolKey = singleton ? contentKey : `${contentKey}_${instanceId}`;
        if (this.webContentsViewPool.has(poolKey)) {
            console.log(`Reusing existing view: ${poolKey}`);
            return this.webContentsViewPool.get(poolKey);
        }

        // 創建新的 WebContentsView
        const newContentsView = new WebContentsView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preload || undefined
            }
        });

        newContentsView.webContents.once('did-finish-load', () => {
            console.log('Content WebContentsView finished loading');
        });

        newContentsView.webContents.once('dom-ready', () => {
            console.log('Content WebContentsView DOM ready');
        });

        try {
            switch (srcType) {
                case 'local_html':
                    await newContentsView.webContents.loadFile(path);
                    break;
                case 'server_url':
                case 'remote_url':
                    await newContentsView.webContents.loadURL(path);
                    break;
                case 'embedded':
                    break;
                default:
                throw new Error(`Unknown source type: ${srcType}`);
            }

            newContentsView.setVisible(false);
            this.webContentsViewPool.set(poolKey, newContentsView); // 用傳入的KEY當作
            return newContentsView;

        } catch (error) {
            console.error(`Failed to load ${poolKey}:`, error);
            return null;
        }
    }

    // 保持向後兼容性的方法
    loadPage(filename) {
        this.loadMainContentView(filename);
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