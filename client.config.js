const WebContentsView_Config = [
  { key: 'SIDEBAR', instanceId:'default', show: true},
  { key: 'EDITOR', instanceId:'default',show: true, buttonName: '編輯器'},
  { key: 'PREVIEWER', instanceId: '1', show: false, buttonName: '預覽1' },
  { key: 'PREVIEWER', instanceId: '2', show: false, buttonName: '預覽2' },
];

const Client_Env = {
  Account: "User00123",
  Password: "321321",
  API: "/",
  Project: "./webProject/xxxxx",
  Folder: "/"
};

const Deploy_Env = {

};


module.exports = {
  WebContentsView_Config,
  Client_Env,
  Deploy_Env
};