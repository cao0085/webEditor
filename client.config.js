const WCV_DEFAULT_SETTING = {

  panels: {
    'sidebar-1': { type: 'SIDEBAR', name: '側邊攔' },
    'editor-1': { type: 'EDITOR', name: '編輯器' },
    'previewer-1': { type: 'PREVIEWER', name: '預覽1' },
    'previewer-2': { type: 'PREVIEWER', name: '預覽2' },
    'previewer-3': { type: 'PREVIEWER', name: '測試在mean' },
  },

  initial: ['sidebar-1', 'editor-1', 'previewer-1', 'previewer-2', 'previewer-3'],

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