
## IPC 是 Inter-Process Communication（進程間通信）的縮寫。

Electron 架構

Electron 應用有兩種進程：

┌─────────────────┐    IPC    ┌─────────────────┐
│   Main Process  │ ◄────────► │ Renderer Process│
│   (Node.js)     │           │   (Chromium)    │
│                 │           │                 │
│ • 控制應用生命週期  │           │ • 顯示 UI        │
│ • 創建窗口        │           │ • 運行 HTML/CSS/JS│
│ • 訪問系統 API    │           │ • 受安全限制      │
└─────────────────┘           └─────────────────┘

為什麼需要 IPC？

安全性考量：
- Renderer Process 運行在沙盒環境中，不能直接訪問 Node.js API
- 需要通過 IPC 與 Main Process 通信來執行特權操作



WebContentView
有提供辨識屬性 contentsView.webContents.id