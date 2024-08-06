const { app, BrowserWindow, ipcMain } = require("electron");
const { globalShortcut } = require("electron");
const axios = require("axios");
const { Client } = require("minecraft-launcher-core");
const { Auth } = require("msmc");
const fs = require("fs");
const path = require("path");
const Store = require("electron-store");
const { Console } = require("console");
const { exit, electron } = require("process");
const store = new Store();

const modDir = path.join(process.env.APPDATA, ".argon", "mods");
let playerToken = null;
let jrePath =
  "C:/Users/alexi/AppData/Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/java-runtime-gamma/windows-x64/java-runtime-gamma/bin/javaw.exe";
let win;
const modApi = "https://api.modrinth.com/v2/";
const mods = [
  "Axiom",
  "Sodium",
  "Lithium",
  "Starlight",
  "c2me",
  "Fabric Api",
  "Reese's Sodium Options",
  "Sodium Extras",
  "Iris Shaders",
  "Mod Menu",
  "Indium",
  "Dynamic FPS",
  "Continuity",
  "StutterFix",
  "ETF",
  "EMF",
  "Zoomify",
  "LazyDFU",
  "Better F3",
];

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
  ipcMain.on("play", () => {
    handlePlay();
  });
  ipcMain.on("clearStore", () => {
    store.clear();
    app.relaunch();
    exit(0);
  });
  ipcMain.on("set-version", (event, arg) => {
    console.log("Last version played: " + store.get("lastPlayedVersion"));
    console.log("Set version to:", arg);
    store.set("version", arg);
  });
});

const launcher = new Client();

function handlePlay() {
  store.set("lastPlayedVersion", store.get("version"));
  let version = store.get("version");

  removeMods();

  let versionDir = path.join(
    process.env.APPDATA,
    ".argon",
    "versions",
    `fabric-${version}`
  );
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

      installMods(version);

      launcher.launch(opts);
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

function removeMods() {
  if (fs.existsSync(modDir)) {
    fs.rm(modDir, { recursive: true });
  }
}

async function installMods(version) {
  const modDir = path.join(process.env.APPDATA, ".argon", "mods");
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  for (const mod of mods) {
    const modPath = path.join(modDir, `${mod}-${version}.jar`);
    if (!fs.existsSync(modPath)) {
      try {
        const searchResponse = await axios.get(modApi + "search", {
          params: {
            query: mod,
            sort: "relevance",
          },
        });

        const modId = searchResponse.data.hits[0].slug;
        const versionResponse = await axios.get(
          modApi + "project/" + modId + "/version",
          {
            params: {
              loaders: "fabric",
            },
          }
        );

        const filteredData = versionResponse.data.filter((item) =>
          item.game_versions.includes(version)
        );
        if (filteredData.length > 0) {
          const downloadUrl = filteredData[0].files[0].url; // Adjust index if there are multiple files

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
        } else {
          console.log(`No compatible version found for ${mod}`);
        }
      } catch (error) {
        console.error(`Error downloading ${mod}:`, error.message);
      }
    } else {
      console.log(`${mod} is already downloaded.`);
    }
  }
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
