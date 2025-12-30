const { app, BrowserWindow, ipcMain, Menu, shell, safeStorage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Import du gestionnaire de clés API
require('./api-keys-updater.cjs');

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
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyBxu15F8LevYrOlTDuzYZL6HhlkZr4hoH4',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyDGRMh1j5gNtm5FiEvnZzBRzLA0bDUwPtI',
  EXA_API_KEY: process.env.EXA_API_KEY || '41167bf3-ef95-44b9-b0b0-0585b6c36032',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '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',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_deE9kGwp5YqD@ep-long-poetry-ag1nth21-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  REDIS_URL: process.env.REDIS_URL || 'rediss://default:ASOCAAImcDJmNzA1ZDk5MmQ4ZTA0OWQ0YjU1NGZmMGEzMDkzNzI0NnAyOTA5MA@set-dane-9090.upstash.io:6379',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://set-dane-9090.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'ASOCAAImcDJmNzA1ZDk5MmQ4ZTA0OWQ0YjU1NGZmMGEzMDkzNzI0NnAyOTA5MA',
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_EztQVwHMY342gd4P_Q07nn3mmlwkIOdEM8CgGIOvZGX7xsx',
  BLOBV2_READ_WRITE_TOKEN: process.env.BLOBV2_READ_WRITE_TOKEN || 'vercel_blob_rw_kJgxWtnRFMqwO9QJ_W1Y2szGSBz1YLkdbA0UY6MnP38ew4N',
  SERPER_API_KEY: process.env.SERPER_API_KEY || 'bdea48ff19e291cedb58b6351e94bf52b855fedd',
  SCRAPINGDOG_API_KEY: process.env.SCRAPINGDOG_API_KEY || '69104453f5ea5a22ad7baeb7',
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY || 'e2eae5e4841e01f263dbbb4237703800981131fa5056905eaea9a9ac22669fdb',
  PARALLEL_API_KEY: process.env.PARALLEL_API_KEY || 'VGH4pnV8X_Mhw7C38QtA4qBaq0ZKNzwuCBM7eTzw',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || 'AIzaSyAJGfQKi0eWbihhyKCbqd3GuPf0DmXNhg0',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || 'fc-9f939918167f48519dcf16046365069c',
  LOCAL_AUTH_SECRET: process.env.LOCAL_AUTH_SECRET || '8f3a9d2e7c1b4f6a8e9d3c2b1a0f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '9f3a7b2c8d4e1f6a5b8c7d0e3f1a2b9c',
  PUSHER_APP_ID: process.env.PUSHER_APP_ID || '2065410',
  PUSHER_KEY: process.env.PUSHER_KEY || '889a70f21c46f6adb843',
  PUSHER_SECRET: process.env.PUSHER_SECRET || '20d2562ff0d7a84c8b1f',
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'eu',
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY || '889a70f21c46f6adb843',
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@scira.local',
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
        { label: 'XQL', click: () => mainWindow.loadURL(`http://localhost:${PORT}/xql`) },
        { type: 'separator' },
        { label: 'Gérer les clés API', accelerator: 'CmdOrCtrl+K', click: () => mainWindow.loadURL(`http://localhost:${PORT}/settings/api-keys`) }
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
