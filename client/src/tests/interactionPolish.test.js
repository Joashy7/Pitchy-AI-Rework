import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

const SCRIPT_PANEL_LOCATION = "client/src/components/newPitch/ScriptPanel.jsx";
const PITCH_HISTORY_LOCATION = "client/src/components/dashboard/PitchHistoryTable.jsx";
const AUTH_FORM_LOCATION = "client/src/components/auth/AuthForm.jsx";
const USE_PITCH_AUDIO_LOCATION = "client/src/hooks/usePitchAudio.js";
const USE_MICROPHONE_LOCATION = "client/src/hooks/useMicrophone.js";

/**
 * Renders a hook in a server-rendered probe component and captures its return value.
 *
 * Args:
 * @param {Function} useHook - Hook callback to execute during render.
 *
 * Returns:
 * @returns {unknown} Value returned by the hook.
 */
const renderHookSnapshot = (useHook) => {
  let snapshot;

  function HookProbe() {
    snapshot = useHook();
    return React.createElement("div", null, "hook-probe");
  }

  renderToStaticMarkup(React.createElement(HookProbe));
  return snapshot;
};

/**
 * Resolves the readable type name for a React element.
 *
 * Args:
 * @param {React.ReactElement} element - React element to inspect.
 *
 * Returns:
 * @returns {string} String tag name, component function name, displayName, or empty string.
 */
const getElementTypeName = (element) => {
  if (typeof element?.type === "string") return element.type;

  return element?.type?.displayName || element?.type?.name || "";
};

/**
 * Finds the first React element in a tree that matches a predicate.
 *
 * Args:
 * @param {React.ReactNode} node - React node or element tree to search.
 * @param {Function} predicate - Callback that receives each valid React element.
 *
 * Returns:
 * @returns {React.ReactElement|null} First matching element, or null when none is found.
 */
const findReactElement = (node, predicate) => {
  if (!React.isValidElement(node)) return null;
  if (predicate(node)) return node;

  const children = React.Children.toArray(node.props?.children);
  for (const child of children) {
    const match = findReactElement(child, predicate);
    if (match) return match;
  }

  return null;
};

/**
 * Finds every React element in a tree that matches a predicate.
 *
 * Args:
 * @param {React.ReactNode} node - React node or element tree to search.
 * @param {Function} predicate - Callback that receives each valid React element.
 *
 * Returns:
 * @returns {React.ReactElement[]} Matching elements in traversal order.
 */
const findReactElements = (node, predicate) => {
  if (!React.isValidElement(node)) return [];

  const matches = predicate(node) ? [node] : [];
  const children = React.Children.toArray(node.props?.children);

  return matches.concat(
    children.flatMap((child) => findReactElements(child, predicate))
  );
};

/**
 * Temporarily replaces global fetch for an async test.
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
 * Temporarily replaces global Audio for an async test.
 *
 * Args:
 * @param {Function} AudioClass - Mock Audio constructor.
 * @param {Function} callback - Async callback to run while Audio is mocked.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores original Audio afterward.
 */
const withMockedAudio = async (AudioClass, callback) => {
  const originalAudio = globalThis.Audio;
  globalThis.Audio = AudioClass;

  try {
    return await callback();
  } finally {
    if (originalAudio) {
      globalThis.Audio = originalAudio;
    } else {
      delete globalThis.Audio;
    }
  }
};

/**
 * Temporarily suppresses console.error for an async test.
 *
 * Args:
 * @param {Function} callback - Async callback to run while console.error is muted.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores original console.error afterward.
 */
const withSuppressedConsoleError = async (callback) => {
  const originalError = console.error;
  console.error = () => {};

  try {
    return await callback();
  } finally {
    console.error = originalError;
  }
};

/**
 * Temporarily replaces global navigator for an async test.
 *
 * Args:
 * @param {object} navigatorValue - Navigator-like object to install on globalThis.
 * @param {Function} callback - Async callback to run while navigator is mocked.
 *
 * Returns:
 * @returns {Promise<unknown>} Callback result; always restores original navigator afterward.
 */
const withMockedNavigator = async (navigatorValue, callback) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: navigatorValue,
  });

  try {
    return await callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "navigator", descriptor);
    } else {
      delete globalThis.navigator;
    }
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

globalThis.loggedClientTest("ScriptPanel - text change and analyze callbacks", SCRIPT_PANEL_LOCATION, async () => {
  const { default: ScriptPanel } = await globalThis.loadClientModule(
    "/src/components/newPitch/ScriptPanel.jsx"
  );
  const changedValues = [];
  let analyzeClickCount = 0;
  const element = ScriptPanel({
    estimatedTime: "0:12",
    isDisabled: false,
    isTextAnalyzing: false,
    onAnalyzeScript: () => {
      analyzeClickCount += 1;
    },
    onScriptChange: (value) => changedValues.push(value),
    scriptText: "Initial pitch",
    wordCount: 2,
  });
  const textarea = findReactElement(element, (candidate) => getElementTypeName(candidate) === "textarea");
  const button = findReactElement(element, (candidate) => (
    getElementTypeName(candidate) === "button" && candidate.props.type === "button"
  ));

  textarea.props.onChange({ target: { value: "Updated pitch" } });
  button.props.onClick();

  assert.deepEqual(changedValues, ["Updated pitch"]);
  assert.equal(analyzeClickCount, 1);
  assert.equal(button.props.disabled, false);
});

globalThis.loggedClientTest("ScriptPanel - disabled analyzing state", SCRIPT_PANEL_LOCATION, async () => {
  const { default: ScriptPanel } = await globalThis.loadClientModule(
    "/src/components/newPitch/ScriptPanel.jsx"
  );
  const markup = renderToStaticMarkup(React.createElement(ScriptPanel, {
    estimatedTime: "0:30",
    isDisabled: true,
    isTextAnalyzing: true,
    onAnalyzeScript() {},
    onScriptChange() {},
    scriptText: "Pitch text",
    wordCount: 2,
  }));

  assert.match(markup, /Analyzing/);
  assert.match(markup, /disabled/);
});

globalThis.loggedClientTest("PitchHistoryTable - view analysis callback", PITCH_HISTORY_LOCATION, async () => {
  const { default: PitchHistoryTable } = await globalThis.loadClientModule(
    "/src/components/dashboard/PitchHistoryTable.jsx"
  );
  let selectedPitch = null;
  const pitch = {
    date: "2026-06-08",
    description: "Recorded demo pitch",
    duration: "00:45",
    id: "pitch_joashy_0",
    name: "Demo Pitch",
    score: 91,
    score_analysis_available: true,
  };
  const table = PitchHistoryTable({
    currentPage: 1,
    error: "",
    isLoading: false,
    onNextPage() {},
    onPageChange() {},
    onPreviousPage() {},
    onViewAnalysis: (nextPitch) => {
      selectedPitch = nextPitch;
    },
    pitches: [pitch],
    showingEnd: 1,
    showingStart: 1,
    totalItems: 1,
    totalPages: 1,
    visiblePages: [1],
  });
  const pitchRow = findReactElement(table, (candidate) => getElementTypeName(candidate) === "PitchRow");
  const resolvedRow = pitchRow.type(pitchRow.props);
  const analysisLink = findReactElement(resolvedRow, (candidate) => candidate.props?.to === "/analysis");

  analysisLink.props.onClick();

  assert.equal(selectedPitch, pitch);
});

globalThis.loggedClientTest("PitchHistoryTable - pagination callbacks", PITCH_HISTORY_LOCATION, async () => {
  const { default: PitchHistoryTable } = await globalThis.loadClientModule(
    "/src/components/dashboard/PitchHistoryTable.jsx"
  );
  const events = [];
  const table = PitchHistoryTable({
    currentPage: 2,
    error: "",
    isLoading: false,
    onNextPage: () => events.push("next"),
    onPageChange: (page) => events.push(`page:${page}`),
    onPreviousPage: () => events.push("previous"),
    onViewAnalysis() {},
    pitches: [],
    showingEnd: 0,
    showingStart: 0,
    totalItems: 0,
    totalPages: 3,
    visiblePages: [1, 2, 3],
  });
  const paginationButtons = findReactElements(
    table,
    (candidate) => getElementTypeName(candidate) === "PaginationButton"
  );

  paginationButtons[0].props.onClick();
  paginationButtons[1].props.onClick();
  paginationButtons.at(-1).props.onClick();

  assert.deepEqual(events, ["previous", "page:1", "next"]);
});

globalThis.loggedClientTest("AuthForm - submitting and provider UI states", AUTH_FORM_LOCATION, async () => {
  const { default: AuthForm } = await globalThis.loadClientModule("/src/components/auth/AuthForm.jsx");
  const markup = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(AuthForm, {
      error: "Invalid credentials",
      isSubmitting: true,
      onSubmit() {},
      secondaryLabel: "Create Account",
      secondaryTo: "/signup",
      socialProviders: [
        { icon: React.createElement("span", null, "G"), label: "Google" },
        { icon: React.createElement("span", null, "GH"), label: "GitHub" },
      ],
      submitLabel: "Sign In",
      submittingLabel: "Signing In...",
      subtitle: "Access your dashboard.",
      title: "Welcome Back",
    }))
  );

  assert.match(markup, /Sign in with Google/);
  assert.match(markup, /Sign in with GitHub/);
  assert.match(markup, /Signing In/);
  assert.match(markup, /Invalid credentials/);
  assert.match(markup, /disabled/);
});

globalThis.loggedClientTest("usePitchAudio - plays generated audio", USE_PITCH_AUDIO_LOCATION, async () => {
  const { usePitchAudio } = await globalThis.loadClientModule("/src/hooks/usePitchAudio.js");
  const requests = [];
  const playedUrls = [];
  const hook = renderHookSnapshot(() => usePitchAudio({
    onError: (message) => {
      throw new Error(`Unexpected audio error: ${message}`);
    },
  }));

  class MockAudio {
    constructor(url) {
      this.url = url;
    }

    play() {
      playedUrls.push(this.url);
    }
  }

  await withMockedAudio(MockAudio, async () => {
    await withMockedFetch(async (url, options) => {
      requests.push({
        body: JSON.parse(options.body),
        method: options.method,
        url,
      });

      return createJsonResponse({
        audioUrl: "data:audio/mpeg;base64,abc123",
      });
    }, async () => {
      await hook.playPitchAudio("Read this improved pitch.");
    });
  });

  assert.deepEqual(playedUrls, ["data:audio/mpeg;base64,abc123"]);
  assert.equal(requests[0].url, "http://localhost:3000/generate-pitch-audio");
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(requests[0].body, {
    transcript: "Read this improved pitch.",
  });
});

globalThis.loggedClientTest("usePitchAudio - reports generation failure", USE_PITCH_AUDIO_LOCATION, async () => {
  const { usePitchAudio } = await globalThis.loadClientModule("/src/hooks/usePitchAudio.js");
  const errors = [];
  const hook = renderHookSnapshot(() => usePitchAudio({
    onError: (message) => errors.push(message),
  }));

  await withSuppressedConsoleError(async () => {
    await withMockedFetch(async () => createJsonResponse({
      error: "ElevenLabs unavailable",
    }, false, 503), async () => {
      await hook.playPitchAudio("Read this pitch.");
    });
  });

  assert.deepEqual(errors, ["ElevenLabs unavailable"]);
});

globalThis.loggedClientTest("useMicrophone - unsupported browser error", USE_MICROPHONE_LOCATION, async () => {
  const { useMicrophone } = await globalThis.loadClientModule("/src/hooks/useMicrophone.js");
  const errors = [];

  await withMockedNavigator({}, async () => {
    const hook = renderHookSnapshot(() => useMicrophone({
      onError: (message) => errors.push(message),
    }));

    await hook.startRecording();
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not support audio recording/);
});
