let Store, store;

async function initStore() {
  if (!Store) {
    Store = (await import('electron-store')).default;
    store = new Store();
  }
  return store;
}

async function isLoggedIn() {
  const s = await initStore();
  return s.get('isLoggedIn', false);
}

function createLoginWindow() {
  const { BrowserWindow } = require('electron');

  const loginWindow = new BrowserWindow({
    width: 300,
    height: 200,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>登入</title>
      <style>
        body { font-family: Arial; padding: 20px; margin: 0; }
        input { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
        button { width: 100%; padding: 10px; margin: 5px 0; }
      </style>
    </head>
    <body>
      <h3>應用程式登入</h3>
      <input type="text" id="username" placeholder="帳號" value="admin">
      <input type="password" id="password" placeholder="密碼" value="admin123">
      <button onclick="login()">登入</button>
      <script>
        function login() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;

          if (username === 'admin' && password === 'admin123') {
            require('electron').ipcRenderer.send('login-success');
          } else {
            alert('帳號密碼錯誤');
          }
        }

        document.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') login();
        });
      </script>
    </body>
    </html>
  `;

  loginWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  return loginWindow;
}

function createMainWindow() {
  // 這會在 main.js 中被 windowManager.initialize() 取代
  console.log('Creating main window...');
}

async function logout() {
  const s = await initStore();
  s.delete('isLoggedIn');
}

module.exports = {
  isLoggedIn,
  createLoginWindow,
  createMainWindow,
  logout
};