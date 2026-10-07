const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAppPreference: (key, value) => ipcRenderer.invoke('set-app-preference', key, value),
  getAppPreferences: () => ipcRenderer.invoke('get-app-preferences'),
  restartApp: () => ipcRenderer.send('restart-app'),
  notifyReadyToShow: () => ipcRenderer.send('ready-to-show'),
  exportPreferencesFile: () => ipcRenderer.invoke('save-preferences-file'),
  importPreferencesFile: () => ipcRenderer.invoke('import-preferences-file'),
  deletePreferencesFile: () => ipcRenderer.invoke('delete-preferences-file'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  generatePlayerAuthKey: () => ipcRenderer.invoke('generate-player-auth-key'),
  updateDiscordRPC: (details, state) => ipcRenderer.send('update-discord-rpc', details, state),
  // zoom de toda la interfaz (1 = 100%)
  setZoom: (factor) => webFrame.setZoomFactor(Math.min(2, Math.max(0.5, Number(factor) || 1)))
});
