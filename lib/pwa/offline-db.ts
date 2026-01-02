export type ChatSnapshot = {
  key: string;
  userId: string;
  chatId: string;
  updatedAt: number;
  messages: unknown[];
};

export type OutboxItem = {
  id: string;
  userId: string;
  chatId: string;
  userChatKey: string;
  createdAt: number;
  payload: unknown;
  placeholderMessageId?: string;
  model?: string;
  group?: string;
};

const DB_NAME = 'hyper-pwa';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function getDb(): Promise<IDBDatabase> {
  if (!isBrowser()) throw new Error('IndexedDB unavailable');
  if (!('indexedDB' in window)) throw new Error('IndexedDB unavailable');

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains('chatSnapshots')) {
          const store = db.createObjectStore('chatSnapshots', { keyPath: 'key' });
          store.createIndex('by_user', 'userId', { unique: false });
          store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'id' });
          store.createIndex('by_user_chat', 'userChatKey', { unique: false });
          store.createIndex('by_user_chat_createdAt', ['userChatKey', 'createdAt'], { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

export function makeUserChatKey(userId: string, chatId: string) {
  return `${userId}:${chatId}`;
}

export async function saveChatSnapshot(input: Omit<ChatSnapshot, 'key'>): Promise<void> {
  const db = await getDb();
  const key = makeUserChatKey(input.userId, input.chatId);
  const tx = db.transaction('chatSnapshots', 'readwrite');
  tx.objectStore('chatSnapshots').put({ ...input, key });
  await txDone(tx);
}

export async function loadChatSnapshot(userId: string, chatId: string): Promise<ChatSnapshot | null> {
  const db = await getDb();
  const key = makeUserChatKey(userId, chatId);
  const tx = db.transaction('chatSnapshots', 'readonly');
  const value = await req<ChatSnapshot | undefined>(tx.objectStore('chatSnapshots').get(key));
  await txDone(tx);
  return value ?? null;
}

export async function enqueueOutboxItem(item: OutboxItem): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('outbox', 'readwrite');
  tx.objectStore('outbox').put(item);
  await txDone(tx);
}

export async function listOutboxItems(userId: string, chatId: string): Promise<OutboxItem[]> {
  const db = await getDb();
  const userChatKey = makeUserChatKey(userId, chatId);
  const tx = db.transaction('outbox', 'readonly');
  const store = tx.objectStore('outbox');
  const index = store.index('by_user_chat_createdAt');

  const items: OutboxItem[] = [];

  await new Promise<void>((resolve, reject) => {
    const range = IDBKeyRange.bound([userChatKey, 0], [userChatKey, Number.MAX_SAFE_INTEGER]);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result as IDBCursorWithValue | null;
      if (!cursor) {
        resolve();
        return;
      }
      items.push(cursor.value as OutboxItem);
      cursor.continue();
    };

    cursorReq.onerror = () => reject(cursorReq.error);
  });

  await txDone(tx);
  return items;
}

export async function deleteOutboxItem(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('outbox', 'readwrite');
  tx.objectStore('outbox').delete(id);
  await txDone(tx);
}
