/**
 * Complémente jsdom pour Vitest (matchMedia, canvas, navigation, etc.).
 * Zone.js / zone.js/testing : polyfills de la config de build `vitest`.
 */
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  }

  window.scrollTo = vi.fn() as typeof window.scrollTo;
  window.open = vi.fn() as typeof window.open;

  const g = globalThis as unknown as { __immoVitestHistoryStubbed?: boolean };
  if (!g.__immoVitestHistoryStubbed) {
    g.__immoVitestHistoryStubbed = true;
    try {
      vi.spyOn(history, 'pushState').mockImplementation(() => {});
      vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    } catch {
      /* jsdom */
    }
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

const canvas2dStub = {
  canvas: {} as HTMLCanvasElement,
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
};

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    (contextId: string) =>
      (contextId === '2d' ? canvas2dStub : null) as unknown as RenderingContext
  );
}

HTMLAnchorElement.prototype.click = vi.fn(function noopClick(this: HTMLAnchorElement) {
  void this;
});

if (!globalThis.indexedDB) {
  const createSuccessRequest = <T>(result: T) => {
    const req = {
      result,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    queueMicrotask(() => {
      req.onsuccess?.({ target: req } as unknown as Event);
    });
    return req;
  };

  const createObjectStoreStub = () => ({
    add: vi.fn(() => createSuccessRequest(undefined)),
    put: vi.fn(() => createSuccessRequest(undefined)),
    get: vi.fn(() => createSuccessRequest(undefined)),
    delete: vi.fn(() => createSuccessRequest(undefined)),
    clear: vi.fn(() => createSuccessRequest(undefined)),
    createIndex: vi.fn(),
    index: vi.fn(() => ({
      getAll: vi.fn(() => createSuccessRequest([])),
      get: vi.fn(() => createSuccessRequest(undefined)),
    })),
  });

  class StubIDBDatabase implements Partial<IDBDatabase> {
    private readonly stores = new Set<string>();
    objectStoreNames = {
      contains: (name: string) => this.stores.has(String(name)),
    } as DOMStringList;

    createObjectStore(name: string): IDBObjectStore {
      this.stores.add(name);
      return createObjectStoreStub() as unknown as IDBObjectStore;
    }

    transaction = vi.fn((storeNames: string | string[]) => {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      return {
        objectStore: vi.fn((name: string) => {
          if (!names.includes(name)) {
            throw new Error(`Unknown object store: ${name}`);
          }
          return createObjectStoreStub();
        }),
      };
    });

    close = vi.fn();
  }

  globalThis.indexedDB = {
    open(): IDBOpenDBRequest {
      const db = new StubIDBDatabase() as unknown as IDBDatabase;
      const req = {} as unknown as IDBOpenDBRequest & {
        result: IDBDatabase;
        onsuccess: ((event: Event) => void) | null;
        onerror: ((event: Event) => void) | null;
        onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
      };
      req.result = db;
      queueMicrotask(() => {
        req.onupgradeneeded?.({ target: req } as unknown as IDBVersionChangeEvent);
        req.onsuccess?.({ target: req } as unknown as Event);
      });
      return req as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}
