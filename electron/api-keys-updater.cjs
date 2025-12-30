const { ipcMain, dialog } = require('electron');
const Store = require('electron-store');
const { safeStorage } = require('electron');

const store = new Store({
  encryptionKey: 'hyper-desktop-secure-key',
  name: 'hyper-config'
});

/**
 * Gestionnaire pour mettre à jour une clé API
 */
ipcMain.handle('update-api-key', async (event, keyName, newValue) => {
  try {
    if (!keyName || !newValue) {
      return { success: false, error: 'Nom de clé ou valeur manquante' };
    }

    // Chiffrer la nouvelle valeur
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(newValue);
      store.set(`encrypted.${keyName}`, encrypted.toString('base64'));
    } else {
      store.set(`plain.${keyName}`, newValue);
    }

    return { success: true, message: 'Clé API mise à jour avec succès' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Gestionnaire pour lire une clé API (version masquée)
 */
ipcMain.handle('get-api-key-preview', async (event, keyName) => {
  try {
    let value;
    
    if (safeStorage.isEncryptionAvailable() && store.has(`encrypted.${keyName}`)) {
      const encrypted = Buffer.from(store.get(`encrypted.${keyName}`), 'base64');
      value = safeStorage.decryptString(encrypted);
    } else {
      value = store.get(`plain.${keyName}`);
    }

    if (!value) {
      return { success: false, error: 'Clé non trouvée' };
    }

    // Masquer la clé (afficher seulement les 4 premiers et 4 derniers caractères)
    const masked = value.length > 8 
      ? `${value.slice(0, 4)}...${value.slice(-4)}`
      : '****';

    return { success: true, preview: masked };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Gestionnaire pour lister toutes les clés disponibles
 */
ipcMain.handle('list-api-keys', async () => {
  try {
    const allKeys = store.get('encrypted') || store.get('plain') || {};
    const keyNames = Object.keys(allKeys).map(key => key.replace('encrypted.', '').replace('plain.', ''));
    return { success: true, keys: keyNames };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Gestionnaire pour réinitialiser toutes les clés aux valeurs par défaut
 */
ipcMain.handle('reset-all-keys', async (event, defaultKeys) => {
  try {
    Object.entries(defaultKeys).forEach(([key, value]) => {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(value);
        store.set(`encrypted.${key}`, encrypted.toString('base64'));
      } else {
        store.set(`plain.${key}`, value);
      }
    });

    store.set('apiKeysInitialized', true);
    return { success: true, message: 'Toutes les clés ont été réinitialisées' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

module.exports = {
  updateApiKey: (keyName, newValue) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(newValue);
      store.set(`encrypted.${keyName}`, encrypted.toString('base64'));
    } else {
      store.set(`plain.${keyName}`, newValue);
    }
  },
  
  getApiKey: (keyName) => {
    if (safeStorage.isEncryptionAvailable() && store.has(`encrypted.${keyName}`)) {
      const encrypted = Buffer.from(store.get(`encrypted.${keyName}`), 'base64');
      return safeStorage.decryptString(encrypted);
    }
    return store.get(`plain.${keyName}`);
  }
};
