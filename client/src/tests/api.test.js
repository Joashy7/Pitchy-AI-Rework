import assert from "node:assert/strict";

const LOCATION = "client/src/lib/api.js";

const withMockedFetch = async (fetchFn, callback) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchFn;

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
};

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
