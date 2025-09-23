import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    // 取得全域配置
    if (window.APP_CONFIG) {
      setConfig(window.APP_CONFIG)
    }
  }, [])

  // Helper function to get image URL
  const getImageUrl = (imageName) => {
    if (!config?.cdnUrl || !imageName) return ''
    return `${config.cdnUrl}/${imageName}`
  }

  return (
    <>
      {/* 動態資源配置檢查區塊 */}
      <div style={{
        background: '#f0f0f0',
        padding: '15px',
        margin: '10px 0',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📋 動態資源配置檢查</h3>

        <div style={{ marginBottom: '10px' }}>
          <strong>🌐 當前環境:</strong> {window.location.hostname === 'localhost' ? 'Local Development' : 'Production'}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>🔧 建置模式:</strong> <code>{config?._debug?.buildMode || '載入中...'}</code>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>📁 CDN URL:</strong> <code>{config?.cdnUrl || '載入中...'}</code>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>🏷️ Header Test:</strong> {config?.headerTest || '載入中...'}
        </div>

        {/* 除錯資訊 */}
        {config?._debug && (
          <details style={{ marginTop: '10px', fontSize: '12px' }}>
            <summary style={{ cursor: 'pointer', color: '#666' }}>🐛 除錯資訊</summary>
            <div style={{
              marginTop: '5px',
              padding: '8px',
              background: '#f8f8f8',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              <div><strong>建置模式:</strong> {config._debug.buildMode}</div>
              <div><strong>是否 Production:</strong> {config._debug.isProduction ? 'Yes' : 'No'}</div>
              <div><strong>自動 CDN:</strong> {config._debug.autoCdnUrl}</div>
              <div><strong>手動覆蓋:</strong> {config._debug.manualCdnUrl || 'None'}</div>
              <div><strong>最終 CDN:</strong> {config._debug.finalCdnUrl}</div>
            </div>
          </details>
        )}

        {/* 測試各種圖片載入 */}
        {config?.images && (
          <div style={{ marginTop: '15px' }}>
            <strong>🖼️ 測試圖片載入:</strong>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              {Object.entries(config.images).map(([key, filename]) => {
                const imageUrl = getImageUrl(filename)
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', marginBottom: '5px' }}>{key}</div>
                    <img
                      src={imageUrl}
                      alt={`Test ${key}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        border: '2px solid #ddd',
                        borderRadius: '4px',
                        objectFit: 'cover'
                      }}
                      onLoad={() => console.log(`✅ 圖片載入成功 [${key}]:`, imageUrl)}
                      onError={() => console.log(`❌ 圖片載入失敗 [${key}]:`, imageUrl)}
                    />
                    <div style={{ fontSize: '10px', marginTop: '2px', color: '#666' }}>
                      {filename}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#e8f4f8',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>💡 使用方式:</strong> 修改 <code>/config-setting.js</code> 的 <code>cdnUrl</code> 即可切換資源來源，無需重新部署！
        </div>
      </div>

      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>{config?.headerTest || 'Vite + React'}</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
