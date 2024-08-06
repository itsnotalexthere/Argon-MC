const { app, BrowserWindow, ipcMain } = require("electron");
const { globalShortcut } = require("electron");
const axios = require("axios");
const { Client } = require("minecraft-launcher-core");
const { Auth } = require("msmc");
const fs = require("fs");
const path = require("path");
const Store = require("electron-store");
const { Console } = require("console");
const { exit } = require("process");
const store = new Store();

let playerToken = null;
let jrePath =
  "C:/Users/alexi/AppData/Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/java-runtime-gamma/windows-x64/java-runtime-gamma/bin/javaw.exe";
let win;

// Electron main function, DO NOT TOUCH UNLESS CHANGING SETTINGS
const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  //win.removeMenu();
  if (store.get("playerToken")) {
    win.loadFile(path.join(__dirname, "public", "play.html"));
  } else {
    win.loadFile(path.join(__dirname, "public", "login.html"));
  }
};

app.whenReady().then(() => {
  createWindow();
  ipcMain.on("login-MSA", () => {
    handleLogin();
  });
  ipcMain.on("play", (version) => {
    handlePlay(version);
  });
  ipcMain.on("clearStore", () => {
    store.clear();
    exit(0);
  });
});

const launcher = new Client();

function handlePlay(version) {
  console.log("Version: " + version);
  store.set("version", version);

  version = store.get("version");
  let versionDir = path.join(process.env.APPDATA, ".argon", "versions", `fabric-${version}`);
  let gamePath = path.join(process.env.APPDATA, ".argon");
  
  console.log("Path: " + versionDir);

  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }


  // Retrieve the playerToken from the local storage
  let playerToken = store.get("playerToken");
  let opts = {
    clientPackage: null,
    // Simply call this function to convert the msmc Minecraft object into a mclc authorization object
    authorization: playerToken,
    root: gamePath,
    version: {
      number: version,
      type: "release",
      custom: `fabric-${version}`,
    },
    memory: {
      max: "6G",
      min: "4G",
    },
    javaPath: jrePath,
  };
  axios
    .get(
      `https://meta.fabricmc.net/v2/versions/loader/${version}/0.15.11/profile/json`
    )
    .then((response) => {
      // Write the JSON response to the local filesystem
      const versionFile = path.join(versionDir, `fabric-${version}.json`);
      fs.writeFileSync(versionFile, JSON.stringify(response.data, null, 2));

      // Launch the game with the updated opts object
      console.log("Starting!");
      launcher.launch(opts);

      launcher.on("debug", (e) => console.log(e));
      launcher.on("data", (e) => console.log(e));
    })
    .catch((error) => {
      console.error(error);
    });
}

function handleLogin() {
  const authManager = new Auth("select_account");
  authManager.launch("electron").then(async (xboxManager) => {
    const token = await xboxManager.getMinecraft();
    playerToken = token.mclc(); // Assign the token to the outer playerToken variable
    BrowserWindow.getFocusedWindow().loadFile(
      path.join(__dirname, "public", "play.html")
    );
    store.set("playerToken", playerToken);
  });
}
