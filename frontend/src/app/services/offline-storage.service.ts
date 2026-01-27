import { Injectable } from '@angular/core';
import { QueuedAction, QueuedActionStatus } from './offline-queue.service';

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

export interface LocalIdMapping {
  localId: string;
  serverId: number;
  entityType: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly DB_NAME = 'offline-db';
  private readonly DB_VERSION = 1;
  private readonly QUEUE_STORE = 'queue';
  private readonly CACHE_STORE = 'cache';
  private readonly MAPPING_STORE = 'id-mapping';

  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.QUEUE_STORE)) {
          const queueStore = db.createObjectStore(this.QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.CACHE_STORE)) {
          const cacheStore = db.createObjectStore(this.CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.MAPPING_STORE)) {
          const mappingStore = db.createObjectStore(this.MAPPING_STORE, { keyPath: 'localId' });
          mappingStore.createIndex('serverId', 'serverId', { unique: false });
          mappingStore.createIndex('entityType', 'entityType', { unique: false });
        }
      };
    });
  }

  private async ensureDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    await this.initializeDatabase();
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  async addQueuedAction(action: QueuedAction): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const request = store.add(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueuedAction(action: QueuedAction): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedAction(id: string): Promise<QueuedAction | null> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(): Promise<QueuedAction[]> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const index = store.index('status');
      const request = index.getAll(QueuedActionStatus.PENDING);

      request.onsuccess = () => {
        const actions = request.result || [];
        actions.sort((a, b) => a.timestamp - b.timestamp);
        resolve(actions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFailedActions(): Promise<QueuedAction[]> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const index = store.index('status');
      const request = index.getAll(QueuedActionStatus.FAILED);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteQueuedAction(id: string): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearQueue(): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(this.QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData(key: string, data: any, ttlMinutes?: number): Promise<void> {
    const db = await this.ensureDatabase();
    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: ttlMinutes ? Date.now() + (ttlMinutes * 60 * 1000) : undefined
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(this.CACHE_STORE);
      const request = store.put(cachedData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.CACHE_STORE], 'readonly');
      const store = transaction.objectStore(this.CACHE_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result: CachedData | undefined = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result.expiresAt && result.expiresAt < Date.now()) {
          this.deleteCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(this.CACHE_STORE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(this.CACHE_STORE);
      const index = store.index('expiresAt');
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async mapLocalToServerId(localId: string, serverId: number, entityType = 'default'): Promise<void> {
    const db = await this.ensureDatabase();
    const mapping: LocalIdMapping = {
      localId,
      serverId,
      entityType,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.MAPPING_STORE], 'readwrite');
      const store = transaction.objectStore(this.MAPPING_STORE);
      const request = store.put(mapping);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getServerId(localId: string): Promise<number | null> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.MAPPING_STORE], 'readonly');
      const store = transaction.objectStore(this.MAPPING_STORE);
      const request = store.get(localId);

      request.onsuccess = () => {
        const result: LocalIdMapping | undefined = request.result;
        resolve(result?.serverId || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getLocalId(serverId: number): Promise<string | null> {
    const db = await this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.MAPPING_STORE], 'readonly');
      const store = transaction.objectStore(this.MAPPING_STORE);
      const index = store.index('serverId');
      const request = index.get(serverId);

      request.onsuccess = () => {
        const result: LocalIdMapping | undefined = request.result;
        resolve(result?.localId || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedDossiers(): Promise<any[]> {
    const data = await this.getCachedData('recent-dossiers');
    return data ? JSON.parse(data) : [];
  }

  async cacheDossier(dossier: any): Promise<void> {
    const cached = await this.getCachedDossiers();
    const filtered = cached.filter((d: any) => d.id !== dossier.id);
    filtered.unshift(dossier);
    const limited = filtered.slice(0, 50);
    await this.cacheData('recent-dossiers', JSON.stringify(limited), 60 * 60 * 1000);
  }

  async clearDossierCache(): Promise<void> {
    await this.deleteCachedData('recent-dossiers');
  }

  async clearMessageCache(): Promise<void> {
    await this.deleteCachedData('recent-messages');
  }
}
