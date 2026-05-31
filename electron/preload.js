const { contextBridge } = require('electron')

// Expose a minimal API to renderer if needed later
contextBridge.exposeInMainWorld('electronAPI', {})
