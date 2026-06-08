import assert from "node:assert/strict";

import {
  createLocalStorageMock,
  installLocalStorageMock,
  withMockedNow,
} from "./helpers/browserMocks.js";

globalThis.loggedClientTest("browserMocks - localStorage behavior", "client/src/tests/helpers/browserMocks.js", async () => {
  const localStorage = createLocalStorageMock();

  localStorage.setItem("a", 1);
  localStorage.setItem("b", "two");

  assert.equal(localStorage.length, 2);
  assert.equal(localStorage.getItem("a"), "1");
  assert.equal(localStorage.key(1), "b");
  localStorage.removeItem("a");
  assert.equal(localStorage.getItem("a"), null);
  localStorage.clear();
  assert.equal(localStorage.length, 0);
});

globalThis.loggedClientTest("browserMocks - install and mocked time", "client/src/tests/helpers/browserMocks.js", async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("demo", "value");
    assert.equal(globalThis.localStorage.getItem("demo"), "value");

    await withMockedNow(1234, async () => {
      assert.equal(Date.now(), 1234);
    });

    assert.notEqual(Date.now(), 1234);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("logger - error and warning output", "client/src/utils/logger.js", async () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  const errors = [];
  const warnings = [];

  console.error = (...args) => errors.push(args);
  console.warn = (...args) => warnings.push(args);

  try {
    const {
      logError,
      logWarn,
    } = await globalThis.loadClientModule("/src/utils/logger.js");

    logError("error message", { code: 500 });
    logWarn("warning message");

    assert.equal(errors.length, 1);
    assert.equal(errors[0][0], "error message");
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0][0], "warning message");
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
});
