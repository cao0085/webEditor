const fs = require('fs');
const path = require('path');
const { BrowserWindow, WebContentsView, Menu, ipcMain } = require('electron');
const { CONTENT_SOURCE } = require('./sourceManager');


class WindowManager {

    constructor() {
        this.mainWindow = null; // type BrowserWindow
        this.webContentsViewPool = new Map();   // 緩存已創建的 views
        this.viewState = {
            sidebar: null,
            current: null, // poolKey
            previous: null,
            history: []
        };
        this.sidebarWidth = 200;
        this.minSidebarWidth = 150;
        this.maxSidebarWidth = 400;
        this.isResizing = false;
    }

    createMainWindow(viewConfigs) {
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

        // 監聽滑鼠事件用於側邊欄寬度調整
        this.setupSidebarResizing();

        // 設置 IPC 監聽器
        this.setupIPCListeners();

        this.mainWindow.on('closed', () => {
            console.log('🔒 Window closed');
            this.mainWindow = null;
            this.mainWebContentsView = null;
            this.webContentsViewPool.clear();
        });
        
        // CREATE RENDERER PROCESS
        this.initializeViewsAsync(viewConfigs) // (不阻塞)

        // 創建選單
        this.createMenu();
        return this.mainWindow;
    }

    async initializeViewsAsync(viewConfigs) {
        try {
            const results = await Promise.all(
                viewConfigs.map(config => 
                    this.ensureWebContentView(config.key, config.instanceId)
                )
            );

            if (!results.every(view => view !== null)) {
                throw new Error('Some views failed to load');
            }

            // 處理所有 views - 全部添加到窗口但根據 show 設置可見性
            viewConfigs.forEach((config, index) => {
                if (results[index]) {
                    const view = results[index];
                    this.mainWindow.contentView.addChildView(view);
                    view.setVisible(config.show); // 根據 config.show 設置可見性
                    console.log(view);

                    // 設置狀態引用
                    if (config.key === 'SIDEBAR') {
                        this.viewState.sidebar = view;
                    } else if (config.key === 'EDITOR' && config.instanceId === 'main') {
                        this.viewState.current = view;
                    }
                }
            });
            this.updateViewBounds();
            console.log('All views initialized successfully');
        } catch (error) {
            console.error('❌ Views initialization failed:', error);
        }
    }

    switchToView(webContentView) {
      if (!(webContentView instanceof WebContentsView)) {
          console.log("SetWCViewVisible: Parameter isn't WebContentView OBJ");
          return false;
      }
      console.log("Switch To.... ")

      // 檢查當前 view 是否存在並隱藏
      if (this.viewState.current && this.viewState.current.setVisible) {
          this.viewState.current.setVisible(false);
      }

      // 更新狀態
      this.viewState.previous = this.viewState.current;
      if (this.viewState.previous) {
          this.viewState.history.push(this.viewState.previous);
      }
      this.viewState.current = webContentView;

      // 確保新 view 有正確的邊界設置
      this.updateViewBounds();
      webContentView.setVisible(true);
      console.log(this.webContentsViewPool)
      console.log("Switch _____________________ ")
      return true;
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

    setupSidebarResizing() {
        // 設置滑鼠事件監聽器用於調整側邊欄寬度
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            // 這裡可以處理快捷鍵調整側邊欄寬度
        });
    }

    setupIPCListeners() {
        // 處理來自 renderer 進程的側邊欄調整請求
        ipcMain.handle('resize-sidebar', (event, newWidth) => {
            this.setSidebarWidth(newWidth);
            return this.getSidebarWidth(); // 返回實際設置的寬度
        });

        // 獲取當前側邊欄寬度
        ipcMain.handle('get-sidebar-width', () => {
            return this.getSidebarWidth();
        });
    }

    setSidebarWidth(newWidth) {
        // 限制寬度範圍
        this.sidebarWidth = Math.max(
            this.minSidebarWidth,
            Math.min(this.maxSidebarWidth, newWidth)
        );
        this.updateViewBounds();
    }

    updateViewBounds() {
        if (!this.mainWindow) return;

        const bounds = this.mainWindow.getContentBounds();

        // 確保側邊欄寬度不超過窗口寬度的一半
        const maxAllowedWidth = Math.floor(bounds.width * 0.5);
        if (this.sidebarWidth > maxAllowedWidth) {
            this.sidebarWidth = maxAllowedWidth;
        }

        // 設置側邊欄邊界
        if (this.viewState.sidebar) {
            this.viewState.sidebar.setBounds({
                x: 0,
                y: 0,
                width: this.sidebarWidth,
                height: bounds.height
            });
        }

        // 設置當前內容區邊界
        if (this.viewState.current) {
            this.viewState.current.setBounds({
                x: this.sidebarWidth,
                y: 0,
                width: bounds.width - this.sidebarWidth,
                height: bounds.height
            });
        }

        // 更新所有在池中但未顯示的 views 的邊界，以備切換時使用
        this.webContentsViewPool.forEach((view, key) => {
            if (view !== this.viewState.sidebar && view !== this.viewState.current) {
                view.setBounds({
                    x: this.sidebarWidth,
                    y: 0,
                    width: bounds.width - this.sidebarWidth,
                    height: bounds.height
                });
            }
        });
    }

    createMenu() {
      console.log('📋 Creating menu');
      
      const template = [
        {
          label: '檔案',
          submenu: [
            // {
            //   label: '載入 Page 1',
            //   click: () => this.loadPage('page01.html')
            // },
            // {
            //   label: '載入 Page 2',
            //   click: () => this.loadPage('page02.html')
            // },
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
          label: '視圖',
          submenu: [
            {
              label: '切換側邊欄',
              accelerator: 'Ctrl+B',
              click: () => {
                this.toggleSidebar();
              }
            },
            {
              label: '增加側邊欄寬度',
              accelerator: 'Ctrl+Shift+=',
              click: () => {
                this.setSidebarWidth(this.sidebarWidth + 20);
              }
            },
            {
              label: '減少側邊欄寬度',
              accelerator: 'Ctrl+Shift+-',
              click: () => {
                this.setSidebarWidth(this.sidebarWidth - 20);
              }
            },
            {
              label: '重置側邊欄寬度',
              click: () => {
                this.setSidebarWidth(200);
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
                if (this.viewState.current) {
                  this.viewState.current.webContents.openDevTools();
                }
              }
            },
            {
              label: '重新載入',
              accelerator: 'F5',
              click: () => {
                if (this.viewState.current) {
                  this.viewState.current.webContents.reload();
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
      return this.viewState.current;
    }

    getSidebarWidth() {
      return this.sidebarWidth;
    }

    // 切換側邊欄顯示/隱藏
    toggleSidebar() {
      if (this.viewState.sidebar) {
        const isVisible = this.viewState.sidebar.getBounds().width > 0;
        if (isVisible) {
          this.setSidebarWidth(0);
        } else {
          this.setSidebarWidth(200); // 恢復默認寬度
        }
      }
    }

    closeAllWindows() {
      if (this.mainWindow) {
        this.mainWindow.close();
      }
    }
  }

module.exports = WindowManager;