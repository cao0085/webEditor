// 項目更新
window.electronAPI.onSidebarUpdate(updateCallback);

function updateCallback(data) {
  console.log('收到 sidebar 更新:', data);
  updateSidebarUI(data);
}

function updateSidebarUI(data) {
    const container = document.getElementById('sidebar-container');
    container.innerHTML = '';

    data.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'nav-button';
        btn.textContent = item.name;
        btn.onclick = () => {
            if (window.electronAPI && window.electronAPI.switchView) {
                window.electronAPI.switchView(item.id);
            }
        };
        container.appendChild(btn);
    });
}

// 側邊欄拖曳調整功能
let isResizing = false;
let startX = 0;
let startWidth = 0;

const resizer = document.getElementById('sidebarResizer');

resizer.addEventListener('mousedown', async (e) => {
    isResizing = true;
    startX = e.clientX;

    try {
        startWidth = await window.electronAPI.getSidebarWidth();
    } catch (error) {
        console.error('獲取側邊欄寬度失敗:', error);
        startWidth = 200; // 預設值
    }

    resizer.classList.add('resizing');
    document.body.style.userSelect = 'none'; // 防止拖曳時選取文字

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
});

function handleMouseMove(e) {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    // 通過 IPC 通知主進程調整寬度
    if (window.electronAPI && window.electronAPI.resizeSidebar) {
        window.electronAPI.resizeSidebar(newWidth);
    }
}

function handleMouseUp() {
    if (!isResizing) return;

    isResizing = false;
    resizer.classList.remove('resizing');
    document.body.style.userSelect = ''; // 恢復文字選取

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

// 防止雙擊拖曳手柄時選取文字
resizer.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// 添加缺少的函數定義
function initializeSidebar() {
    console.log('側邊欄初始化完成');
}

document.addEventListener('DOMContentLoaded', initializeSidebar);
console.log('側邊欄已載入，拖曳功能已啟用');

