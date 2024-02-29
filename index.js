const { app, BrowserWindow } = require("electron");

// Eectron main function, DO NOT TOUCH UNLESS CHANGING SETTINGS
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  win.menuBarVisible(false);
  win.toggleTabBar();
  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();
});
