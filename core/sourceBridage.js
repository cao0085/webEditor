const path = require('path');

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
    preload: path.join(__dirname, 'preload.js'),
    singleton: true
  },
  
  EDITOR: {
    srcType: SOURCE_TYPES.LOCAL_HTML,
    path: path.join(__dirname, 'testRender', 'page01.html'),
    name: 'editor',
    preload: undefined,
    singleton: true
  },
  
  PREVIEWER: {
    srcType: SOURCE_TYPES.LOCAL_HTML,
    path: path.join(__dirname, 'testRender', 'page02.html'),
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
  SOURCE_TYPES,
  WEBVIEW_SOURCE
};