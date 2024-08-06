const { contextBridge, ipcRenderer } = require("electron/renderer")

contextBridge.exposeInMainWorld("electronAPI", {
    login: () => ipcRenderer.send("login-MSA"),
    play: () => ipcRenderer.send("play"),
});