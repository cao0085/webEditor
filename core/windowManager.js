const fs = require('fs');
const path = require('path');
const { BrowserWindow, WebContentsView, Menu, ipcMain } = require('electron');
const { LAYOUT_MODE } = require('./sourceBridage');
const { createWCV, isAvailableToCreateWC, getValidWebContents } = require('./viewController/webViewLifecycle');


class WindowManager {
  constructor() {
    this.mainWindow = null; // type BrowserWindow
    this.inWindowMenuWVC = new Map();
    this.inSidebarWVC = new Map();
    this.showingWCV = new Set();
    this.currentView = {
      layoutMode: LAYOUT_MODE.SIDEBAR_WITH_MAIN,
      sideWithMain: {sidebar:null,main:null},
      fullScreen: null,
      overlay: null
    };
    
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

    this._isInitialized = false;
  }

  // 外部調用的入口
  async initialize(viewConfigs) {
    if (this._isInitialized) {
      console.warn('WindowManager already initialized');
      return this.mainWindow;
    }

    this.#createWindowFrame();
    this.menu = this.#createEmptyMenu();
    const loadPromise = this.#initializeViewsAsync(viewConfigs);

    loadPromise.then(() => {
      this.#createCompleteMenu();
      console.log('All views loaded and menu finalized');
    }).catch(error => {
      console.error('Error loading views:', error);
    });

    this._isInitialized = true;
    return this.mainWindow;
  }

  //#region 初始化方法
  #createWindowFrame() {
    console.log('Creating window frame...');
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '..', 'preload.js')
      },
      show: true
    });

    // 設置基本事件監聽
    this.#setupEventListeners();
    
    return this.mainWindow; // 返回創建的窗口
  }

  #setupEventListeners() {
    this.mainWindow.on('resize', () => {
      this.updateViewBounds();
    });

    this.mainWindow.on('closed', () => {
      console.log('🔒 Window closed');
      // this.#cleanup();
    });
  }

  #createEmptyMenu() {
    const template = [
      {
        label: '檔案',
        submenu: [
          { label: '退出', click: () => app.quit() }
        ]
      },
      {
        label: '視圖',
        submenu: [
          { label: '載入中...', enabled: false }
        ]
      }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }

  #createCompleteMenu() {
    const template = [
      {
        label: '檔案',
        submenu: [
          { type: 'separator' },
          { 
            label: '退出', 
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit() 
          }
        ]
      },
      // {
      //   label: '小工具',
      //   submenu: [
      //     ...this.#createSidebarMenuItems(),
      //     { type: 'separator' },
      //     ...this.#createViewControlMenuItems()
      //   ]
      // },
      {
        label: '工具',
        submenu: [
          ...this.#createMVCMenuItems(),
          { type: 'separator' },
          // {
          //   label: '開啟開發者工具',
          //   accelerator: 'F12',
          //   click: () => this.#openDevTools()
          // },
          // {
          //   label: '重新載入',
          //   accelerator: 'F5',
          //   click: () => this.#reloadCurrentView()
          // }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    console.log('✅ Complete menu created');
  }

  #createMVCMenuItems() {
    const items = [];
    
    for (const [name, webContentsId] of this.inWindowMenuWVC.entries()) {
      items.push({
        label: `${name}`,
        click: () => this.switchMainWCV(webContentsId)
      });
    }
    
    return items;
  }

  async #initializeViewsAsync(configSetting) {
    const { panels, initial, triggers } = configSetting;
    const { inSidebar, inMenu } = triggers;

    for (const str of initial) {
      const { type, name } = panels[str];
      if (isAvailableToCreateWC(type)) {
        const view = await createWCV(type);
        const webContentsId = view.webContents.id;
        this.mainWindow.contentView.addChildView(view);

        if (inSidebar.includes(str)) {
          this.inSidebarWVC.set(name, webContentsId);
        } else if (inMenu.includes(str)) {
          this.inWindowMenuWVC.set(name, webContentsId);
        }
      }
    }

    this.updateViewBounds();
  }
  // #endregion

  //#region 外部調用
  switchMainWCV(webContentID) {
    console.log("switch to __",webContentID)

    if (this.showingWCV.has(webContentID)) {
      console.log("Already showing", webContentID);
      return;
    }

    const webContent = getValidWebContents(webContentID);
    if (!webContent) {
      console.error("Invalid webContentID:", webContentID);
      return;
    }

    // 根據 LAYOUT 判斷要替換的 WVC
    const {SIDEBAR_WITH_MAIN, FULLSCREEN_SINGLE, POPUP_OVERLAY} = LAYOUT_MODE;

    switch(this.currentView.layoutMode) {

      case SIDEBAR_WITH_MAIN:
        // 排除null
        this.currentView.sideWithMain?.main?.setVisible(false);
        this.currentView.fullScreen?.setVisible(false);
        this.currentView.overlay?.setVisible(false);

        webContent.setVisible(true);
        this.currentView.sideWithMain?.sidebar?.setVisible(true);
        
        if (this.currentView.sideWithMain) {
          this.currentView.sideWithMain.main = webContent;
        }
        break;
      
      case FULLSCREEN_SINGLE:
        this.currentView.sideWithMain?.sidebar?.setVisible(false);
        this.currentView.sideWithMain?.main?.setVisible(false);
        this.currentView.fullScreen?.setVisible(false);
        this.currentView.overlay?.setVisible(false);

        webContent.setVisible(true);
        this.currentView.fullScreen = webContent;
        break;
        
      case POPUP_OVERLAY:
        break;
        
      default:
        console.warn('Unknown layout mode:', this.currentView.layoutMode);
        break;
    }

    this.updateViewBounds();
  }

  getInSidebarWVC() {
    return this.inSidebarWVC
  }

  getSidebarWVCList() {
    const id = this.inSidebarWVC.get(name);
    return id ? webContents.fromId(id) : null;
  }

  notifySidebarUpdate() {
    const data = Array.from(this.inSidebarWVC.entries()).map(([name, id]) => ({
      name, id
    }));
    
    const sidebarView = this.currentView.sideWithMain?.sidebar;
    if (sidebarView && sidebarView.webContents) {
      sidebarView.webContents.send('update-sidebar', data);
    }
  }

  getMenuView(name) {
    const id = this.inWindowMenuWVC.get(name);
    return id ? webContents.fromId(id) : null;
  }
  // #endregion

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