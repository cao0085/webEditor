const fs = require('fs');
const path = require('path');
const { WebContentsView, webContents } = require('electron');
const { WEBVIEW_SOURCE, SOURCE_TYPES } = require('../sourceBridage');

async function createWCV(viewType, isIntegration = false, isIsolation= true) {

  if(!(viewType in WEBVIEW_SOURCE)) {
    return null;
  }

  const viewConfig = WEBVIEW_SOURCE[viewType]
  const contentsView = new WebContentsView({
      webPreferences: {
          nodeIntegration: isIntegration,
          contextIsolation: isIsolation,
          preload: viewConfig.preload || undefined
      }
  });

  contentsView.setVisible(false);
  contentsView.webContents.once('did-finish-load', () => {
    console.log('Content WebContentsView finished loading');
  });
  contentsView.webContents.once('dom-ready', () => {
    console.log('Content WebContentsView DOM ready');
  });

  // SOURCE_TYPES
  const {LOCAL_HTML, REMOTE_URL, SERVER_URL, EMBEDDED} = SOURCE_TYPES
  const srcPath = viewConfig.path;
  const srcType = viewConfig.sourceType;
  const isSingleton = viewConfig.singleton || false;

  switch (srcType) {
    case LOCAL_HTML:
      await contentsView.webContents.loadFile(srcPath);
      break;
    case REMOTE_URL:
    case SERVER_URL:
      await contentsView.webContents.loadURL(srcPath);
      break;
    case EMBEDDED:
      break;
    default:
      console.log('FC:CreateWCView Error => Not Define SrcType');
      return null;
  }

  // 自訂義辨識屬性
  contentsView._inAppCustomType = viewType
  contentsView._isSingleton = isSingleton

  return contentsView;// WebContentsView Instance
}

function isAvailableToCreateWC(viewType) {

  if (!(viewType in WEBVIEW_SOURCE)) {
    console.log("FC: isAvailableCreate error : Not Define viewType")
    return false;
  }

  const { singleton } = WEBVIEW_SOURCE[viewType];

  if (singleton) {
    const allWC = webContents.getAllWebContents();
    const filteredWC = allWC.filter(
      wc => wc._isSingleton === true && wc._inAppCustomType === viewType
    );
    return filteredWC.length === 0;
  }

  return true;
}

function isWebContentsValid(webContentID) {
  try {
    const wc = webContents.fromId(webContentID);
    return wc && !wc.isDestroyed();
  } catch (error) {
    return false;
  }
}

function getValidWebContents(webContentID) {
  try {
    const wc = webContents.fromId(webContentID);
    return (wc && !wc.isDestroyed()) ? wc : null;
  } catch (error) {
    return null;
  }
}

async function getAllWCView() {
  webContents.getAllWebContents()
}

module.exports = {
  createWCV,
  isWebContentsValid,
  isAvailableToCreateWC,
  getValidWebContents,
  getAllWCView
};