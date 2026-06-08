/**
 * Creates an in-memory localStorage-compatible mock.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {Storage} Mock storage object with clear, getItem, key, removeItem, setItem, and length support.
 */
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

/**
 * Installs the localStorage mock on globalThis.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {{localStorage: Storage, restore: Function}} Installed mock storage and restore function.
 */
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

/**
 * Temporarily mocks Date.now for a callback.
 *
 * Args:
 * @param {number} timestamp - Timestamp returned by Date.now during the callback.
 * @param {Function} callback - Async or sync callback to run with mocked time.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores Date.now afterward.
 */
export const withMockedNow = async (timestamp, callback) => {
  const originalNow = Date.now;
  Date.now = () => timestamp;

  try {
    return await callback();
  } finally {
    Date.now = originalNow;
  }
};
