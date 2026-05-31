const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

const PORT = process.env.PORT || 9999
const URL = `http://localhost:${PORT}`

let serverProcess = null

function waitForServer(url, timeout = 10000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => resolve())
        .on('error', () => {
          if (Date.now() - start > timeout) return reject(new Error('Server did not start'))
          setTimeout(check, 200)
        })
    }
    check()
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // In development, assume dev server is already running at localhost:9999
  if (process.env.NODE_ENV === 'development') {
    await waitForServer(URL).catch(() => {})
    win.loadURL(URL)
    win.webContents.openDevTools()
    return
  }

  // In production, spawn `npm run start` to serve the built Next app
  serverProcess = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], {
    env: { ...process.env },
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  try {
    await waitForServer(URL, 20000)
    win.loadURL(URL)
  } catch (err) {
    console.error('Failed to start server:', err)
    win.loadURL('about:blank')
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})
