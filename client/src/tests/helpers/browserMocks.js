export const createLocalStorageMock = () => {
  const store = new Map();

  return {
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] || null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
};

export const installLocalStorageMock = () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const localStorage = createLocalStorageMock();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });

  return {
    localStorage,
    restore() {
      if (descriptor) {
        Object.defineProperty(globalThis, "localStorage", descriptor);
      } else {
        delete globalThis.localStorage;
      }
    },
  };
};

export const withMockedNow = async (timestamp, callback) => {
  const originalNow = Date.now;
  Date.now = () => timestamp;

  try {
    return await callback();
  } finally {
    Date.now = originalNow;
  }
};
