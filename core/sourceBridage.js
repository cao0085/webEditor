const path = require('path');
const PRELOAD_PATH = path.join(__dirname, 'electron-control', 'preload.js')

const SOURCE_TYPES = {
  LOCAL_HTML: 'html',
  REMOTE_URL: 'remote_url', 
  SERVER_URL: 'server_url',
  EMBEDDED: 'embedded'
};

const LAYOUT_MODE = {
  SIDEBAR_WITH_MAIN: 'sidebar_with_main',
  FULLSCREEN_SINGLE: 'fullscreen_single',
  POPUP_OVERLAY: 'popup_overlay'
};

const WEBVIEW_SOURCE = {
  SIDEBAR: {
    srcType: SOURCE_TYPES.LOCAL_HTML,
    path: path.join(__dirname, 'sidebar', 'sidebar.html'),
    name: 'sidebar',
    preload: PRELOAD_PATH,
    singleton: true
  },
  
  EDITOR: {
    srcType: SOURCE_TYPES.LOCAL_HTML,
    path: path.join(__dirname, 'editor', 'editor.html'),
    name: 'editor',
    preload: undefined,
    singleton: true
  },
  
  PREVIEWER: {
    srcType: SOURCE_TYPES.LOCAL_HTML,
    path: path.join(__dirname, 'previewer', 'previewer.html'),
    name: 'previewer',
    preload: undefined,
    singleton: false
  },

  // 示例：遠端內容
  DASHBOARD: {
    srcType: SOURCE_TYPES.REMOTE_URL,
    path: 'https://dashboard.example.com',
    name: 'dashboard',
    preload: undefined,
    singleton: false
  },

  // 示例：本地伺服器
  DEV_SERVER: {
    srcType: SOURCE_TYPES.SERVER_URL,
    path: 'http://localhost:3000',
    name: 'dev_server',
    preload: undefined,
    singleton: false
  }
};

module.exports = {
  LAYOUT_MODE,
  PRELOAD_PATH,
  SOURCE_TYPES,
  WEBVIEW_SOURCE
};