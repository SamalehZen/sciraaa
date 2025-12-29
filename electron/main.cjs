const { app, BrowserWindow, ipcMain, Menu, shell, safeStorage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let Store;
try {
  Store = require('electron-store');
} catch (e) {
  Store = class {
    constructor() { this.data = {}; }
    get(key) { return this.data[key]; }
    set(key, value) { this.data[key] = value; }
    has(key) { return key in this.data; }
  };
}

const store = new Store({
  encryptionKey: 'hyper-desktop-secure-key',
  name: 'hyper-config'
});

let mainWindow;
let nextServer;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 3000;

const DEFAULT_API_KEYS = {
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'YOUR_GEMINI_KEY',
  EXA_API_KEY: process.env.EXA_API_KEY || 'YOUR_EXA_KEY',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || 'YOUR_TAVILY_KEY',
  TMDB_API_KEY: process.env.TMDB_API_KEY || 'YOUR_TMDB_KEY',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_KEY',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_KEY',
  DATABASE_URL: process.env.DATABASE_URL || 'YOUR_NEON_DATABASE_URL',
  REDIS_URL: process.env.REDIS_URL || 'YOUR_REDIS_URL',
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || 'YOUR_BLOB_TOKEN',
  SERPER_API_KEY: process.env.SERPER_API_KEY || 'YOUR_SERPER_KEY',
  LOCAL_AUTH_SECRET: process.env.LOCAL_AUTH_SECRET || 'hyper-desktop-local-auth-secret',
  PUSHER_APP_ID: process.env.PUSHER_APP_ID || '',
  PUSHER_KEY: process.env.PUSHER_KEY || '',
  PUSHER_SECRET: process.env.PUSHER_SECRET || '',
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'eu',
};

function initializeApiKeys() {
  if (!store.has('apiKeysInitialized')) {
    Object.entries(DEFAULT_API_KEYS).forEach(([key, value]) => {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value);
        store.set(`encrypted.${key}`, encrypted.toString('base64'));
      } else {
        store.set(`plain.${key}`, value);
      }
    });
    store.set('apiKeysInitialized', true);
  }
}

function getApiKey(keyName) {
  if (safeStorage.isEncryptionAvailable() && store.has(`encrypted.${keyName}`)) {
    const encrypted = Buffer.from(store.get(`encrypted.${keyName}`), 'base64');
    return safeStorage.decryptString(encrypted);
  }
  return store.get(`plain.${keyName}`) || DEFAULT_API_KEYS[keyName];
}

function getEnvironmentVariables() {
  const env = { ...process.env };
  Object.keys(DEFAULT_API_KEYS).forEach(key => {
    env[key] = getApiKey(key);
  });
  env.NEXT_PUBLIC_IS_ELECTRON = 'true';
  env.LOCAL_AUTH_SECRET = getApiKey('LOCAL_AUTH_SECRET') || 'hyper-desktop-local-auth-secret';
  return env;
}

async function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      console.log('Mode développement: connexion au serveur Next.js existant...');
      setTimeout(resolve, 1000);
      return;
    }

    const serverPath = path.join(process.resourcesPath, 'app', 'server.js');

    nextServer = spawn(process.execPath, [serverPath], {
      cwd: process.resourcesPath,
      env: getEnvironmentVariables(),
      stdio: ['inherit', 'pipe', 'pipe']
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
      if (data.toString().includes('Ready') || data.toString().includes('started')) {
        resolve();
      }
    });

    nextServer.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    nextServer.on('error', reject);

    setTimeout(resolve, 10000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Hyper Desktop',
    icon: path.join(__dirname, '..', 'public', 'hyper.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0a0a0a'
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Nouvelle recherche', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.loadURL(`http://localhost:${PORT}`) },
        { type: 'separator' },
        { label: 'Paramètres', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.loadURL(`http://localhost:${PORT}/settings`) },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Forcer actualisation' },
        { role: 'toggleDevTools', label: 'Outils développeur' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom par défaut' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        { label: 'Accueil', accelerator: 'CmdOrCtrl+H', click: () => mainWindow.loadURL(`http://localhost:${PORT}`) },
        { label: 'Admin', click: () => mainWindow.loadURL(`http://localhost:${PORT}/admin`) },
        { label: 'Lookout', click: () => mainWindow.loadURL(`http://localhost:${PORT}/lookout`) },
        { label: 'XQL', click: () => mainWindow.loadURL(`http://localhost:${PORT}/xql`) }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        { label: 'À propos', click: () => mainWindow.loadURL(`http://localhost:${PORT}/about`) },
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/zaidmukaddam/hyper') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('is-electron', () => true);

app.whenReady().then(async () => {
  initializeApiKeys();

  console.log('Démarrage du serveur Next.js...');
  await startNextServer();
  console.log('Serveur Next.js démarré');

  createWindow();
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
});
