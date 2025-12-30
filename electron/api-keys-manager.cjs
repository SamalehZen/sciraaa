const { safeStorage } = require('electron');
const crypto = require('crypto');

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

class ApiKeysManager {
  constructor() {
    this.store = new Store({
      name: 'hyper-api-keys',
      encryptionKey: this.getOrCreateEncryptionKey()
    });
  }

  getOrCreateEncryptionKey() {
    const tempStore = new Store({ name: 'hyper-encryption' });
    const keyPath = 'encryption-key';
    if (!tempStore.has(keyPath)) {
      const key = crypto.randomBytes(32).toString('hex');
      tempStore.set(keyPath, key);
      return key;
    }
    return tempStore.get(keyPath);
  }

  setApiKey(keyName, value) {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(value);
      this.store.set(`keys.${keyName}`, encrypted.toString('base64'));
    } else {
      this.store.set(`keys.${keyName}`, value);
    }
  }

  getApiKey(keyName) {
    const stored = this.store.get(`keys.${keyName}`);
    if (!stored) return null;

    if (safeStorage.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(stored, 'base64');
        return safeStorage.decryptString(buffer);
      } catch {
        return stored;
      }
    }
    return stored;
  }

  getAllKeys() {
    const keys = {};
    const storedKeys = this.store.get('keys') || {};
    Object.keys(storedKeys).forEach(keyName => {
      keys[keyName] = this.getApiKey(keyName);
    });
    return keys;
  }

  initializeDefaultKeys(defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
      if (!this.getApiKey(key)) {
        this.setApiKey(key, value);
      }
    });
  }
}

module.exports = ApiKeysManager;
