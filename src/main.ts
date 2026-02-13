import { config } from "dotenv";
import { app, BrowserWindow } from "electron";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

// Load .env file - try multiple possible locations
const possibleEnvPaths = [
  path.join(process.cwd(), ".env"),
  path.join(__dirname, "../../.env"), // From dist/main back to project root
  path.join(app.getAppPath(), ".env"),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    const result = config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      break;
    }
  }
}

if (!envLoaded && !app.isPackaged) {
  console.warn("[Dotenv] No .env file found in development");
}
import { nativeTheme } from "electron";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

nativeTheme.themeSource = "dark";
import { ipcMain } from "electron/main";
import { autoUpdater } from "electron-updater";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS, UPDATE_CHANNELS } from "./constants";

const inDevelopment = process.env.NODE_ENV === "development";
const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;

// Window state persistence
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

function getWindowStatePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState(): WindowState | null {
  try {
    const filePath = getWindowStatePath();
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf-8")) as WindowState;
  } catch {
    return null;
  }
}

function saveWindowState(window: BrowserWindow): void {
  try {
    const bounds = window.getBounds();
    const state: WindowState = {
      ...bounds,
      isMaximized: window.isMaximized(),
    };
    writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("[WindowState] Failed to save:", err);
  }
}

// Get GitHub token for private repo updates
function getUpdateToken(): string {
  // Development: use .env file (loaded by dotenv)
  // Check both GH_TOKEN and GITHUB_TOKEN for flexibility
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    return token;
  }

  // Production: use bundled config file (created during build/CI)
  // Check in resources directory (where extraResource files are placed)
  const configPath = path.join(process.resourcesPath, "update-config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      return config.token || "";
    } catch (err) {
      console.error("[AutoUpdater] Failed to read update config:", err);
    }
  }

  return "";
}

function getIconPath() {
  if (inDevelopment) {
    // In dev, assets are at the project root
    return path.join(__dirname, "../../assets/icons/icon.png");
  }
  // In production, extraResource places assets in the resources folder
  return path.join(process.resourcesPath, "assets/icons/icon.png");
}

function createWindow() {
  const preload = path.join(__dirname, "../preload/index.js");
  const savedState = loadWindowState();

  const mainWindow = new BrowserWindow({
    width: savedState?.width ?? 1540,
    height: savedState?.height ?? 1080,
    x: savedState?.x,
    y: savedState?.y,
    minWidth: 800,
    minHeight: 600,
    icon: getIconPath(),
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });

  if (savedState?.isMaximized) {
    mainWindow.maximize();
  }

  ipcContext.setMainWindow(mainWindow);

  // Fix keyboard focus after title bar / drag-region interactions.
  // The -webkit-app-region:drag title bar steals focus from the
  // webContents, causing all keyboard shortcuts to silently stop working.
  mainWindow.on("focus", () => mainWindow.webContents.focus());
  mainWindow.on("restore", () => mainWindow.webContents.focus());
  mainWindow.on("moved", () => mainWindow.webContents.focus());

  // Save window state on close
  mainWindow.on("close", () => {
    saveWindowState(mainWindow);
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173"); // electron-vite default port
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Open DevTools in a separate window in development mode
  if (inDevelopment) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

function setupAutoUpdater() {
  // Configure updater for private GitHub repo
  const updateToken = getUpdateToken();
  console.log(
    "[AutoUpdater] Token available:",
    !!updateToken,
    updateToken ? `(${updateToken.length} chars)` : "",
  );

  try {
    autoUpdater.setFeedURL({
      provider: "github",
      owner: "cperuffo3",
      repo: "efis-checklist-editor",
      private: true,
      token: updateToken,
    });
    console.log("[AutoUpdater] Feed URL configured successfully");
  } catch (err) {
    console.error("[AutoUpdater] Failed to set feed URL:", err);
  }

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Make updates silent (Windows: no elevation dialog, install on quit)
  if (process.platform === "win32") {
    autoUpdater.allowDowngrade = false;
  }

  // Forward update events to renderer
  autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] Checking for updates...");
    ipcContext.mainWindow?.webContents.send(UPDATE_CHANNELS.CHECKING);
  });

  autoUpdater.on("update-available", (info) => {
    console.log("[AutoUpdater] Update available:", info.version);
    ipcContext.mainWindow?.webContents.send(UPDATE_CHANNELS.AVAILABLE, info);
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("[AutoUpdater] No update available");
    ipcContext.mainWindow?.webContents.send(
      UPDATE_CHANNELS.NOT_AVAILABLE,
      info,
    );
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[AutoUpdater] Update downloaded:", info.version);
    ipcContext.mainWindow?.webContents.send(UPDATE_CHANNELS.DOWNLOADED, info);

    // On Windows, the update will install silently when the app quits
    // due to autoInstallOnAppQuit: true
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(
      `[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`,
    );
    ipcContext.mainWindow?.webContents.send(UPDATE_CHANNELS.PROGRESS, progress);
  });

  autoUpdater.on("error", (error) => {
    console.error("[AutoUpdater] Error:", error.message);
    ipcContext.mainWindow?.webContents.send(
      UPDATE_CHANNELS.ERROR,
      error.message,
    );
  });

  // Auto-check for updates on startup (only in production, non-portable)
  if (!inDevelopment && !isPortable) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error("[AutoUpdater] Update check failed:", err);
      });
    }, 3000);
  }
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

app
  .whenReady()
  .then(createWindow)
  .then(installExtensions)
  .then(setupAutoUpdater)
  .then(setupORPC);

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
