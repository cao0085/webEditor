const fs = require('fs');
const path = require('path');
const { BrowserWindow, WebContentsView, Menu, ipcMain } = require('electron');
const { PRELOAD_PATH, LAYOUT_MODE } = require('./sourceBridage');
const { createWCV, isAvailableToCreateWC, getValidWebContents, getValidWebContentsView, getAllWCView } = require('./electron-control/webViewLifecycle');


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

    this.sidebarWidth = {
      current: 200,
      min: 150,
      max: 400,
      isResizing: false,
    }

    this._isInitialized = false;
  }

  // 主邏輯
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
      console.log(getAllWCView())
      console.log('All views loaded and menu finalized');
    }).catch(error => {
      console.error('Error loading views:', error);
    });
    
    this._isInitialized = true;
    return this.mainWindow;
  }

  closeAllWindows() {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  //#region 私有初始化方法
  #createWindowFrame() {
    console.log('Creating window frame...');
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: PRELOAD_PATH
      },
      show: true
    });

    // 設置基本事件監聽
    this.mainWindow.on('resize', () => {
      this.updateViewBounds();
    });

    this.mainWindow.on('closed', () => {
      console.log('🔒 Window closed');
      // this.#cleanup();
    });
    
    return this.mainWindow; // 返回創建的窗口
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
    const { panels, initial, defaultView, triggers } = configSetting;
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

        switch (str) {
          case defaultView.sidebar:
            this.currentView.sideWithMain.sidebar = view
            view.setVisible(true)
            break;
          case defaultView.main:
            this.currentView.sideWithMain.main = view
            view.setVisible(true)
            break;
          case defaultView.main:
            this.currentView.sideWithMain.fullScreen = view
            view.setVisible(true)
            break;
          case defaultView.main:
            this.currentView.sideWithMain.overlay = view
            view.setVisible(true)
            break;
          default:
            console.log("not default view", view)
            break
        };
      }
    }
    this.updateViewBounds();

    // 延遲執行確保 sidebar view 已經完全載入
    setTimeout(() => {
      this.notifySidebarUpdate();
    }, 500);
  }
  //#endregion

  //#region 外部調用
  switchMainWCV(webContentID) {

    if (this.showingWCV.has(webContentID)) {
      console.log("Already showing", webContentID);
      return false;
    }

    const webContentView = getValidWebContentsView(webContentID);
    if (!webContentView) {
      console.error("Invalid webContentID:", webContentID);
      return false;
    }

    // 根據 LAYOUT 判斷要替換的 WVC
    const {SIDEBAR_WITH_MAIN, FULLSCREEN_SINGLE, POPUP_OVERLAY} = LAYOUT_MODE;

    switch(this.currentView.layoutMode) {

      case SIDEBAR_WITH_MAIN:
        // 排除null
        this.currentView.sideWithMain?.main?.setVisible(false);
        this.currentView.fullScreen?.setVisible(false);
        this.currentView.overlay?.setVisible(false);

        webContentView.setVisible(true);
        this.currentView.sideWithMain?.sidebar?.setVisible(true);

        if (this.currentView.sideWithMain) {
          this.currentView.sideWithMain.main = webContentView;
        }
        break;
      
      case FULLSCREEN_SINGLE:
        this.currentView.sideWithMain?.sidebar?.setVisible(false);
        this.currentView.sideWithMain?.main?.setVisible(false);
        this.currentView.fullScreen?.setVisible(false);
        this.currentView.overlay?.setVisible(false);

        webContentView.setVisible(true);
        this.currentView.fullScreen = webContentView;
        break;
        
      case POPUP_OVERLAY:
        break;
        
      default:
        console.warn('Unknown layout mode:', this.currentView.layoutMode);
        break;
    }

    this.updateViewBounds();
    return true;
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
  // #endregion

  //#region 調整尺寸
  resizeSidebar(newWidth) {
    this.sidebarWidth.current = Math.max(
      this.sidebarWidth.min,
      Math.min(this.sidebarWidth.max, newWidth)
    );
    this.updateViewBounds();
  }

  updateViewBounds() {

    if (!this.mainWindow) return;
    const bounds = this.mainWindow.getContentBounds();

    // 設置側邊欄邊界
    if (this.currentView.sideWithMain.sidebar) {
      this.currentView.sideWithMain.sidebar.setBounds({
        x: 0,
        y: 0,
        width: this.sidebarWidth.current,
        height: bounds.height
      });
    }

    // 設置當前內容區邊界
    if (this.currentView.sideWithMain.main) {
      this.currentView.sideWithMain.main.setBounds({
        x: this.sidebarWidth.current,
        y: 0,
        width: bounds.width - this.sidebarWidth.current,
        height: bounds.height
      });
    }
  }
  //#endregion

  //#region GET_PROPERTY_FUNCTION
  getMainWindow() {
    return this.mainWindow;
  }

  getCurrentView() {
    return this.viewState.currentView;
  }

  getSidebarWidth() {
    return this.sidebarWidth.current;
  }
  //#endregion


}

module.exports = WindowManager;