import assert from "node:assert/strict";

const LOCATION = "client/src/lib/api.js";

/**
 * Temporarily replaces global fetch for an async API client test.
 *
 * Args:
 * @param {Function} fetchFn - Mock fetch implementation.
 * @param {Function} callback - Async callback to run while fetch is mocked.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores original fetch afterward.
 */
const withMockedFetch = async (fetchFn, callback) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchFn;

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
};

/**
 * Creates a minimal fetch JSON response mock.
 *
 * Args:
 * @param {object} body - Response body returned by json().
 * @param {boolean} [ok] - Whether response.ok should be true.
 * @param {number} [status] - HTTP status code value.
 *
 * Returns:
 * @returns {object} Fetch Response-like object with json, ok, and status fields.
 */
const createJsonResponse = (body, ok = true, status = ok ? 200 : 500) => ({
  json: async () => body,
  ok,
  status,
});

globalThis.loggedClientTest("getDashboardData - includes query", LOCATION, async () => {
  const { getDashboardData } = await globalThis.loadClientModule("/src/lib/api.js");
  let requestedUrl;

  await withMockedFetch(async (url) => {
    requestedUrl = url;
    return createJsonResponse({
      pitches: [],
      stats: {},
      success: true,
    });
  }, async () => {
    const queryParams = new URLSearchParams({
      userId: "user_0",
      username: "Joashy",
    });
    const result = await getDashboardData(queryParams);

    assert.equal(result.success, true);
    assert.equal(
      requestedUrl,
      "http://localhost:3000/dashboard-data?userId=user_0&username=Joashy"
    );
  });
});

globalThis.loggedClientTest("getDashboardData - backend failure", LOCATION, async () => {
  const { getDashboardData } = await globalThis.loadClientModule("/src/lib/api.js");

  await withMockedFetch(async () => createJsonResponse({
    error: "Sheets unavailable",
    success: false,
  }), async () => {
    await assert.rejects(
      () => getDashboardData(),
      /Sheets unavailable/
    );
  });
});

globalThis.loggedClientTest("getDashboardData - non-json failure", LOCATION, async () => {
  const { getDashboardData } = await globalThis.loadClientModule("/src/lib/api.js");

  await withMockedFetch(async () => ({
    json: async () => {
      throw new Error("invalid json");
    },
    ok: false,
    status: 500,
  }), async () => {
    await assert.rejects(
      () => getDashboardData(),
      /Request failed/
    );
  });
});

globalThis.loggedClientTest("api clients - network failure propagation", LOCATION, async () => {
  const {
    analyzeAudioPitch,
    analyzeTextPitch,
    generatePitchAudio,
    getDashboardData,
    login,
    signup,
  } = await globalThis.loadClientModule("/src/lib/api.js");
  const networkError = new TypeError("Network request failed");

  await withMockedFetch(async () => {
    throw networkError;
  }, async () => {
    await assert.rejects(() => getDashboardData(), /Network request failed/);
    await assert.rejects(() => login({ username: "Joashy", password: "secret1" }), /Network request failed/);
    await assert.rejects(() => signup({ username: "Joashy", password: "secret1" }), /Network request failed/);
    await assert.rejects(() => analyzeTextPitch({ transcript: "Pitch." }), /Network request failed/);
    await assert.rejects(() => generatePitchAudio("Pitch."), /Network request failed/);
    await assert.rejects(() => analyzeAudioPitch(new FormData()), /Network request failed/);
  });
});

globalThis.loggedClientTest("login and signup - post credentials", LOCATION, async () => {
  const {
    login,
    signup,
  } = await globalThis.loadClientModule("/src/lib/api.js");
  const requests = [];

  await withMockedFetch(async (url, options) => {
    requests.push({
      body: JSON.parse(options.body),
      method: options.method,
      url,
    });

    return createJsonResponse({
      success: true,
      user: { userId: "user_0", username: requests.at(-1).body.username },
    });
  }, async () => {
    const loginResult = await login({ username: "Joashy", password: "secret1" });
    const signupResult = await signup({ username: "Maya", password: "secret2" });

    assert.equal(loginResult.user.username, "Joashy");
    assert.equal(signupResult.user.username, "Maya");
    assert.deepEqual(requests.map((request) => request.url), [
      "http://localhost:3000/login",
      "http://localhost:3000/signup",
    ]);
    assert.deepEqual(requests.map((request) => request.method), ["POST", "POST"]);
  });
});

globalThis.loggedClientTest("analyzeTextPitch - posts JSON", LOCATION, async () => {
  const { analyzeTextPitch } = await globalThis.loadClientModule("/src/lib/api.js");
  let request;

  await withMockedFetch(async (url, options) => {
    request = { options, url };
    return createJsonResponse({
      success: true,
      transcript: "Typed pitch",
    });
  }, async () => {
    const result = await analyzeTextPitch({
      transcript: "Typed pitch",
      userId: "user_0",
      username: "Joashy",
    });

    assert.equal(request.url, "http://localhost:3000/analyze-text");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(request.options.body), {
      transcript: "Typed pitch",
      userId: "user_0",
      username: "Joashy",
    });
    assert.equal(result.success, true);
  });
});

globalThis.loggedClientTest("generatePitchAudio - posts transcript", LOCATION, async () => {
  const { generatePitchAudio } = await globalThis.loadClientModule("/src/lib/api.js");
  let request;

  await withMockedFetch(async (url, options) => {
    request = { options, url };
    return createJsonResponse({
      audioUrl: "data:audio/mpeg;base64,abc",
    });
  }, async () => {
    const result = await generatePitchAudio("Read this pitch.");

    assert.equal(request.url, "http://localhost:3000/generate-pitch-audio");
    assert.equal(request.options.method, "POST");
    assert.deepEqual(JSON.parse(request.options.body), {
      transcript: "Read this pitch.",
    });
    assert.equal(result.audioUrl, "data:audio/mpeg;base64,abc");
  });
});

globalThis.loggedClientTest("analyzeAudioPitch - posts FormData", LOCATION, async () => {
  const { analyzeAudioPitch } = await globalThis.loadClientModule("/src/lib/api.js");
  const formData = new FormData();
  let request;

  formData.append("file", new Blob(["audio"], { type: "audio/webm" }), "recording.webm");

  await withMockedFetch(async (url, options) => {
    request = { options, url };
    return createJsonResponse({
      success: true,
    });
  }, async () => {
    const result = await analyzeAudioPitch(formData);

    assert.equal(request.url, "http://localhost:3000/analyze");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.body, formData);
    assert.equal(request.options.headers, undefined);
    assert.equal(result.success, true);
  });
});
