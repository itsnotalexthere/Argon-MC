const { contextBridge, ipcRenderer } = require("electron/renderer")

contextBridge.exposeInMainWorld("electronAPI", {
    login: () => ipcRenderer.send("login-MSA"),
    play: (version) => ipcRenderer.send("play", version),
    clearStore: () => ipcRenderer.send("clearStore")
});