import assert from "node:assert/strict";

import {
  installLocalStorageMock,
  withMockedNow,
} from "./helpers/browserMocks.js";

const LOCATION = "client/src/utils/auth.js";

globalThis.loggedClientTest("saveAuthUser - creates expiring session", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    await withMockedNow(1000, async () => {
      const { saveAuthUser } = await globalThis.loadClientModule("/src/utils/auth.js");
      const authState = saveAuthUser({
        userId: "user_0",
        username: "Joashy",
      });
      const storedState = JSON.parse(localStorage.getItem("pitchyUser"));

      assert.equal(authState.userId, "user_0");
      assert.equal(authState.username, "Joashy");
      assert.equal(authState.expiresAt, 3601000);
      assert.ok(authState.token);
      assert.deepEqual(storedState, authState);
    });
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("getAuthenticatedUser - expired session", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("pitchyUser", JSON.stringify({
      expiresAt: 999,
      token: "expired-token",
      userId: "user_0",
      username: "Joashy",
    }));
    localStorage.setItem("pitchPalResults", JSON.stringify({ transcript: "old pitch" }));

    await withMockedNow(1000, async () => {
      const { getAuthenticatedUser } = await globalThis.loadClientModule("/src/utils/auth.js");

      assert.equal(getAuthenticatedUser(), null);
      assert.equal(localStorage.getItem("pitchyUser"), null);
      assert.equal(localStorage.getItem("pitchPalResults"), null);
    });
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("getAuthenticatedUser - malformed storage", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    const { getAuthenticatedUser } = await globalThis.loadClientModule("/src/utils/auth.js");
    localStorage.setItem("pitchyUser", "{not-json");

    assert.equal(getAuthenticatedUser(), null);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("refreshPitchSession - records pitch activity", LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    await withMockedNow(1000, async () => {
      const { saveAuthUser } = await globalThis.loadClientModule("/src/utils/auth.js");
      saveAuthUser({
        token: "session-token",
        userId: "user_0",
        username: "Joashy",
      });
    });

    await withMockedNow(5000, async () => {
      const { refreshPitchSession } = await globalThis.loadClientModule("/src/utils/auth.js");
      const refreshedState = refreshPitchSession();
      const storedState = JSON.parse(localStorage.getItem("pitchyUser"));

      assert.equal(refreshedState.lastPitchAt, 5000);
      assert.equal(refreshedState.expiresAt, 3605000);
      assert.equal(refreshedState.token, "session-token");
      assert.deepEqual(storedState, refreshedState);
    });
  } finally {
    restore();
  }
});
