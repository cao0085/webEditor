const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors') // 

let mainWindow
let previewWindow
let server
let config = null

const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, 'webeditor.config.json')
    const configData = fs.readFileSync(configPath, 'utf8')
    config = JSON.parse(configData)
    console.log('配置檔案載入成功:', config)
    return config
  } catch (error) {
    console.error('載入配置檔案失敗:', error)
    return null
  }
}

const getProjectPath = () => {
  if (!config) return null
  
  const projectPath = config.webProject.projectPath
  if (path.isAbsolute(projectPath)) {
    return projectPath
  } else {
    return path.join(__dirname, projectPath)
  }
}

//====================================================================================================


// 取得 Client build 路徑
const getClientBuildPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'Client/build')
  } else {
    return path.join(__dirname, '../Client/build')
  }
}

// 取得資料儲存路徑
const getDataPath = () => {
  if (app.isPackaged) {
    // 打包後儲存在用戶資料目錄
    return path.join(app.getPath('userData'), 'data')
  } else {
    return path.join(__dirname, '../Client/public/data')
  }
}

// 內建靜態檔案伺服器
const startInternalServer = () => {
  return new Promise((resolve, reject) => {
    const expressApp = express()
    const buildPath = getClientBuildPath()
    
    console.log('建置路徑:', buildPath)
    
    // 檢查 build 資料夾是否存在
    if (!fs.existsSync(buildPath)) {
      reject(new Error(`Client build 資料夾不存在: ${buildPath}`))
      return
    }
    
    // 提供靜態檔案
    expressApp.use(express.static(buildPath))
    
    // 動態提供 content.json
    expressApp.get('/data/content.json', (req, res) => {
      try {
        const dataPath = path.join(getDataPath(), 'content.json')
        if (fs.existsSync(dataPath)) {
          const content = fs.readFileSync(dataPath, 'utf8')
          res.json(JSON.parse(content))
        } else {
          // 預設內容
          res.json({
            title: '我的網站標題',
            description: '這是我的網站描述，可以透過編輯器修改'
          })
        }
      } catch (error) {
        console.error('讀取內容失敗:', error)
        res.status(500).json({ error: '讀取內容失敗' })
      }
    })
    
    // 處理 React Router (SPA)
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'))
    })
    
    // 啟動伺服器
    server = expressApp.listen(3001, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log('內建伺服器啟動在 http://localhost:3001')
        resolve()
      }
    })
  })
}

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    x: 100,
    y: 100,
    title: '內容編輯器',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('editor.html')
}

const createPreviewWindow = () => {
  previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: 650,
    y: 100,
    title: '網站預覽',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  previewWindow.loadURL('http://localhost:3001')
}

// 儲存內容
ipcMain.handle('save-content', async (event, content) => {
  try {
    const dataDir = getDataPath()
    const dataPath = path.join(dataDir, 'content.json')

    console.log('=== 儲存除錯資訊 ===')
    console.log('app.isPackaged:', app.isPackaged)
    console.log('寫入路徑:', dataPath)
    console.log('資料夾是否存在:', fs.existsSync(dataDir))
    
    
    // 確保資料夾存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(content, null, 2))
    
    // 如果是開發模式，也更新 build 資料夾
    if (!app.isPackaged) {
      const buildDataPath = path.join(__dirname, '../Client/build/data/content.json')
      const buildDir = path.dirname(buildDataPath)
      
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true })
      }
      
      fs.writeFileSync(buildDataPath, JSON.stringify(content, null, 2))
    }else {
      // 打包後：複製到預覽頁面可以讀取的位置
      // 這裡需要確保預覽頁面讀取的是同一個檔案
      const previewDataPath = path.join(process.resourcesPath, 'Client/build/data/content.json')
      const previewDir = path.dirname(previewDataPath)
      
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true })
      }
      
      fs.writeFileSync(previewDataPath, JSON.stringify(content, null, 2))
    }
    
    // 重新載入預覽視窗
    if (previewWindow) {
      previewWindow.reload()
    }
    
    return { success: true }
  } catch (error) {
    console.error('儲存失敗:', error)
    return { success: false, error: error.message }
  }
})

// 載入現有內容
ipcMain.handle('load-content', async () => {
  try {
    const dataPath = path.join(getDataPath(), 'content.json')
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8')
      return JSON.parse(content)
    }
    
    // 預設內容
    const defaultContent = { 
      title: '我的網站標題', 
      description: '這是我的網站描述，可以透過編輯器修改' 
    }
    
    return defaultContent
  } catch (error) {
    console.error('載入內容失敗:', error)
    return { title: '預設標題', description: '預設描述' }
  }
})

// 應用程式啟動
app.whenReady().then(async () => {
  try {
    console.log('正在啟動內建伺服器...')
    console.log('是否為打包模式:', app.isPackaged)
    console.log('資源路徑:', process.resourcesPath)
    
    await startInternalServer()
    
    console.log('建立視窗...')
    createMainWindow()
    
    setTimeout(() => {
      createPreviewWindow()
    }, 1000)
    
  } catch (error) {
    console.error('啟動失敗:', error)
    
    const errorWindow = new BrowserWindow({
      width: 500,
      height: 300,
      resizable: false
    })
    
    errorWindow.loadURL(`data:text/html,
      <div style="padding: 20px; font-family: Arial;">
        <h2>啟動失敗</h2>
        <p>錯誤訊息: ${error.message}</p>
        <p>請確保已經執行過建置步驟</p>
        <hr>
        <small>
          <strong>開發模式:</strong> npm run prepare-client<br>
          <strong>打包模式:</strong> 請重新建置應用程式
        </small>
      </div>
    `)
  }
})

// 關閉時清理
app.on('before-quit', () => {
  if (server) {
    console.log('關閉內建伺服器...')
    server.close()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})