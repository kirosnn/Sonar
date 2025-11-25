const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),
  newTab: () => ipcRenderer.invoke('new-tab'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  getThemeColors: () => ipcRenderer.invoke('get-theme-colors'),
  getNewTabPath: () => ipcRenderer.invoke('get-new-tab-path'),
  transcribeAudio: (base64Audio) => ipcRenderer.invoke('transcribe-audio', base64Audio),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (event, colors) => callback(colors));
  }
});
