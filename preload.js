const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  login: () => ipcRenderer.send("login-MSA"),
  play: () => ipcRenderer.send("play"),
  clearStore: () => ipcRenderer.send("clearStore"),
  setVersion: (string) => ipcRenderer.send("set-version", string),
  errorLog: (callback) => ipcRenderer.on('err-log', (event, message) => callback(message)),

});
