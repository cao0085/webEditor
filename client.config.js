const WCV_DEFAULT_SETTING = {

  panels: {
    'sidebar': { type: 'SIDEBAR', name: '側邊攔' },
    'editor-1': { type: 'EDITOR', name: '編輯器' },
    'previewer-1': { type: 'PREVIEWER', name: '預覽1' },
  },
  
  initial: ['sidebar', 'editor-1', 'previewer-1'],

  defaultView: {
    layoutMode: 'sidebar_with_main',
    sidebar: 'sidebar',
    main: 'editor-1',
    fullScreen: null,
    overlay: null
  },

  triggers: {
    inSidebar: ['editor-1', 'previewer-1', 'previewer-2'],
    inMenu: ['previewer-3'],
  }
}

const CLIENT_ENV = {
  Account: "User00123",
  Password: "321321",
  API: "/",
  Project: "./webProject/xxxxx",
  Folder: "/"
};

const DEPLOY_ENV = {

};


module.exports = {
  WCV_DEFAULT_SETTING,
  CLIENT_ENV,
  DEPLOY_ENV
};