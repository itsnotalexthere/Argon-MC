const { app, BrowserWindow, ipcMain } = require("electron");
const axios = require("axios");
const { Client } = require("minecraft-launcher-core");
const { Auth } = require("msmc");
const fs = require("fs");
const path = require("path");
const Store = require("electron-store");
const { fabric } = require("tomate-loaders");

const store = new Store();
let win;
const modApi = "https://api.modrinth.com/v2/";

const mods = ["Sodium", "Lithium", "Logical Zoom", "Fabric API"];
let jrePath = `C:\\Users\\alexi\\AppData\\Roaming\\PrismLauncher\\java\\java-runtime-gamma\\bin\\javaw.exe`;

// Create Electron window
const createWindow = () => {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const startPage = store.get("playerToken")
    ? path.join(__dirname, "public", "play.html")
    : path.join(__dirname, "public", "login.html");

  win.loadFile(startPage);
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.on("login-MSA", handleLogin);
  ipcMain.on("play", handlePlay);
  ipcMain.on("clearStore", () => {
    store.clear();
    win.loadFile(path.join(__dirname, "public", "login.html"));
  });
  ipcMain.on("set-version", (event, version) => {
    console.log("Set version to:", version);
    store.set("version", version);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});

const launcher = new Client();

async function handlePlay() {
  const playerToken = store.get("playerToken");
  const version = store.get("version");
  if (!version) {
    console.error("No version set. Unable to launch the game.");
    return;
  }

  const gamePath = path.join(process.env.APPDATA, ".argon");
  if (!fs.existsSync(gamePath)) {
    fs.mkdirSync(gamePath, { recursive: true });
  }
  let modsDir = path.join(gamePath, "mods");

  const modOpts = await fabric.getMCLCLaunchConfig({
    rootPath: gamePath,
    gameVersion: version,
  });

  const opts = {
    ...modOpts,
    clientPackage: null,
    authorization: playerToken,
    javaPath: jrePath,
    memory: {
      max: "4G",
      min: "2G",
    },
  };

  console.log("Launching the game with options:", opts);

  try {
    await installMods(modsDir, version);

    launcher.launch(opts);

    launcher.on("data", (log) => {
      console.log(log);
    });

    launcher.on("error", (error) => {
      console.error("Launcher error:", error);
    });

    launcher.on("close", (code) => {
      console.log("Game closed with code:", code);
    });
  } catch (error) {
    console.error("Failed to launch the game:", error);
  }
}

function handleLogin() {
  const authManager = new Auth("select_account");
  authManager.launch("electron").then(async (xboxManager) => {
    try {
      const token = await xboxManager.getMinecraft();
      playerToken = token.mclc();
      store.set("playerToken", playerToken);
      console.log("Player token:", playerToken);
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.loadFile(path.join(__dirname, "public", "play.html"));
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  });
}

async function installMods(modDir, version) {
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  for (const mod of mods) {
    const modPath = path.join(modDir, `${mod}-${version}.jar`);
    if (!fs.existsSync(modPath)) {
      try {
        const searchResponse = await axios.get(modApi + "search", {
          params: { query: mod, sort: "relevance" },
        });

        const modId = searchResponse.data.hits[0]?.slug;
        if (!modId) throw new Error(`Mod ID not found for ${mod}`);

        const versionResponse = await axios.get(
          modApi + "project/" + modId + "/version",
          {
            params: { loaders: "fabric" },
          }
        );

        const compatibleVersion = versionResponse.data.find((item) =>
          item.game_versions.includes(version)
        );

        if (!compatibleVersion) {
          console.log(`No compatible version found for ${mod}`);
          continue;
        }

        const downloadUrl = compatibleVersion.files[0].url;
        const writer = fs.createWriteStream(modPath);

        const downloadResponse = await axios.get(downloadUrl, {
          responseType: "stream",
        });

        downloadResponse.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        console.log(`Downloaded ${mod} to ${modPath}`);
      } catch (error) {
        console.error(`Error downloading ${mod}:`, error.message);
      }
    } else {
      console.log(`${mod} is already downloaded.`);
    }
  }
}
