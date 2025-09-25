import path from 'path';

const PRELOAD_PATH: string = path.join(__dirname, 'electron-control', 'preload.js');

// 定義常數類型
const SOURCE_TYPES = {
  LOCAL_HTML: 'html',
  REMOTE_URL: 'remote_url',
  SERVER_URL: 'server_url',
  EMBEDDED: 'embedded'
} as const;

const LAYOUT_MODE = {
  SIDEBAR_WITH_MAIN: 'sidebar_with_main',
  FULLSCREEN_SINGLE: 'fullscreen_single',
  POPUP_OVERLAY: 'popup_overlay'
} as const;

// 定義類型接口
type SourceType = typeof SOURCE_TYPES[keyof typeof SOURCE_TYPES];
type LayoutModeType = typeof LAYOUT_MODE[keyof typeof LAYOUT_MODE];

interface WebViewSourceConfig {
  srcType: SourceType;
  path: string;
  name: string;
  preload?: string;
  singleton: boolean;
}

interface WebViewSourceCollection {
  SIDEBAR: WebViewSourceConfig;
  EDITOR: WebViewSourceConfig;
  PREVIEWER: WebViewSourceConfig;
  DASHBOARD: WebViewSourceConfig;
  DEV_SERVER: WebViewSourceConfig;
}

const WEBVIEW_SOURCE: WebViewSourceCollection = {
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

export {
  LAYOUT_MODE,
  PRELOAD_PATH,
  SOURCE_TYPES,
  WEBVIEW_SOURCE,
  type SourceType,
  type LayoutModeType,
  type WebViewSourceConfig,
  type WebViewSourceCollection
};