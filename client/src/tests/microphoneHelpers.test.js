import assert from "node:assert/strict";

import {
  installLocalStorageMock,
  withMockedNow,
} from "./helpers/browserMocks.js";

const MEDIA_RECORDER_LOCATION = "client/src/hooks/microphone/mediaRecorder.js";
const RECORDING_ERRORS_LOCATION = "client/src/hooks/microphone/recordingErrors.js";
const RECORDING_TIMER_LOCATION = "client/src/hooks/microphone/useRecordingTimer.js";
const AUDIO_ANALYSIS_LOCATION = "client/src/hooks/microphone/audioAnalysis.js";

/**
 * Temporarily replaces global fetch for an async test.
 *
 * Args:
 * @param {Function} fetchFn - Mock fetch implementation.
 * @param {Function} callback - Async callback to run while fetch is mocked.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores the original fetch afterward.
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
 * @param {boolean} [ok] - Whether the response should be treated as successful.
 *
 * Returns:
 * @returns {object} Fetch Response-like object with json and ok fields.
 */
const createJsonResponse = (body, ok = true) => ({
  json: async () => body,
  ok,
});

globalThis.loggedClientTest("stopStreamTracks - stops every track", MEDIA_RECORDER_LOCATION, async () => {
  const { stopStreamTracks } = await globalThis.loadClientModule("/src/hooks/microphone/mediaRecorder.js");
  const stoppedTracks = [];
  const stream = {
    getTracks: () => [
      { stop: () => stoppedTracks.push("first") },
      { stop: () => stoppedTracks.push("second") },
    ],
  };

  stopStreamTracks(stream);
  stopStreamTracks(null);

  assert.deepEqual(stoppedTracks, ["first", "second"]);
});

globalThis.loggedClientTest("createAudioBlob - webm blob", MEDIA_RECORDER_LOCATION, async () => {
  const { createAudioBlob } = await globalThis.loadClientModule("/src/hooks/microphone/mediaRecorder.js");
  const blob = createAudioBlob([new Blob(["audio"], { type: "audio/webm" })]);

  assert.equal(blob.type, "audio/webm");
  assert.equal(blob.size, 5);
});

globalThis.loggedClientTest("createPitchMediaRecorder - event wiring", MEDIA_RECORDER_LOCATION, async () => {
  const originalMediaRecorder = globalThis.MediaRecorder;
  const chunks = [];
  let stopped = false;
  let recorderError = null;

  class FakeMediaRecorder {
    constructor(stream) {
      this.stream = stream;
    }
  }

  globalThis.MediaRecorder = FakeMediaRecorder;

  try {
    const { createPitchMediaRecorder } = await globalThis.loadClientModule(
      "/src/hooks/microphone/mediaRecorder.js"
    );
    const recorder = createPitchMediaRecorder("mock-stream", {
      onChunk: (chunk) => chunks.push(chunk),
      onError: (event) => {
        recorderError = event.error;
      },
      onStop: () => {
        stopped = true;
      },
    });

    recorder.ondataavailable({ data: new Blob([], { type: "audio/webm" }) });
    recorder.ondataavailable({ data: new Blob(["audio"], { type: "audio/webm" }) });
    recorder.onerror({ error: new Error("recorder failed") });
    recorder.onstop();

    assert.equal(recorder.stream, "mock-stream");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].size, 5);
    assert.match(recorderError.message, /recorder failed/);
    assert.equal(stopped, true);
  } finally {
    if (originalMediaRecorder) {
      globalThis.MediaRecorder = originalMediaRecorder;
    } else {
      delete globalThis.MediaRecorder;
    }
  }
});

globalThis.loggedClientTest("getRecordingErrorMessage - browser error names", RECORDING_ERRORS_LOCATION, async () => {
  const {
    getRecordingErrorMessage,
  } = await globalThis.loadClientModule("/src/hooks/microphone/recordingErrors.js");

  assert.match(getRecordingErrorMessage({ name: "NotAllowedError" }), /permission denied/i);
  assert.match(getRecordingErrorMessage({ name: "NotFoundError" }), /No microphone/i);
  assert.match(getRecordingErrorMessage({ name: "NotReadableError" }), /in use/i);
  assert.equal(getRecordingErrorMessage(new Error("other")), "Could not access microphone");
});

globalThis.loggedClientTest("getUnsupportedRecordingMessage - unsupported browser copy", RECORDING_ERRORS_LOCATION, async () => {
  const { getUnsupportedRecordingMessage } = await globalThis.loadClientModule(
    "/src/hooks/microphone/recordingErrors.js"
  );

  assert.match(getUnsupportedRecordingMessage(), /does not support audio recording/);
  assert.match(getUnsupportedRecordingMessage(), /Chrome, Firefox, Edge, or Safari/);
});

globalThis.loggedClientTest("formatRecordingTime - boundaries", RECORDING_TIMER_LOCATION, async () => {
  const { formatRecordingTime } = await globalThis.loadClientModule(
    "/src/hooks/microphone/useRecordingTimer.js"
  );

  assert.equal(formatRecordingTime(0), "00:00");
  assert.equal(formatRecordingTime(9), "00:09");
  assert.equal(formatRecordingTime(65), "01:05");
});

globalThis.loggedClientTest("analyzeRecordedAudio - user FormData and storage", AUDIO_ANALYSIS_LOCATION, async () => {
  const { localStorage, restore } = installLocalStorageMock();
  let request;

  try {
    await withMockedNow(1000, async () => {
      const { saveAuthUser } = await globalThis.loadClientModule("/src/utils/auth.js");
      saveAuthUser({
        token: "session-token",
        userId: "user_0",
        username: "Joashy",
      });
    });

    await withMockedFetch(async (url, options) => {
      request = {
        body: options.body,
        method: options.method,
        url,
      };

      return createJsonResponse({
        success: true,
        transcript: "Recorded pitch.",
      });
    }, async () => {
      await withMockedNow(2000, async () => {
        const { analyzeRecordedAudio } = await globalThis.loadClientModule(
          "/src/hooks/microphone/audioAnalysis.js"
        );
        const result = await analyzeRecordedAudio(new Blob(["audio"], { type: "audio/webm" }));
        const savedAnalysis = JSON.parse(localStorage.getItem("pitchPalResults"));
        const savedAuth = JSON.parse(localStorage.getItem("pitchyUser"));

        assert.equal(result.transcript, "Recorded pitch.");
        assert.equal(request.url, "http://localhost:3000/analyze");
        assert.equal(request.method, "POST");
        assert.equal(request.body.get("userId"), "user_0");
        assert.equal(request.body.get("username"), "Joashy");
        assert.equal(request.body.get("file").name, "recording.webm");
        assert.deepEqual(savedAnalysis, result);
        assert.equal(savedAuth.lastPitchAt, 2000);
      });
    });
  } finally {
    restore();
  }
});
