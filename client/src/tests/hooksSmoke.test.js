import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const USE_PITCH_SCRIPT_LOCATION = "client/src/hooks/usePitchScript.js";
const USE_PITCH_AUDIO_LOCATION = "client/src/hooks/usePitchAudio.js";
const USE_MICROPHONE_LOCATION = "client/src/hooks/useMicrophone.js";
const USE_DASHBOARD_DATA_LOCATION = "client/src/hooks/useDashboardData.js";
const USE_RECORDING_TIMER_LOCATION = "client/src/hooks/microphone/useRecordingTimer.js";
const USE_WAVEFORM_LOCATION = "client/src/hooks/microphone/useWaveformVisualizer.js";

/**
 * Renders a hook in a tiny server-rendered probe component and captures its return value.
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

globalThis.loggedClientTest("usePitchScript - initial state", USE_PITCH_SCRIPT_LOCATION, async () => {
  const { usePitchScript } = await globalThis.loadClientModule("/src/hooks/usePitchScript.js");
  const result = renderHookSnapshot(() => usePitchScript());

  assert.equal(result.scriptText, "");
  assert.equal(result.wordCount, 0);
  assert.equal(result.estimatedTime, "0:00");
  assert.equal(typeof result.setScriptText, "function");
});

globalThis.loggedClientTest("usePitchAudio - initial state", USE_PITCH_AUDIO_LOCATION, async () => {
  const { usePitchAudio } = await globalThis.loadClientModule("/src/hooks/usePitchAudio.js");
  const result = renderHookSnapshot(() => usePitchAudio());

  assert.equal(result.isGeneratingAudio, false);
  assert.equal(typeof result.playPitchAudio, "function");
});

globalThis.loggedClientTest("useMicrophone - initial state", USE_MICROPHONE_LOCATION, async () => {
  const { useMicrophone } = await globalThis.loadClientModule("/src/hooks/useMicrophone.js");
  const result = renderHookSnapshot(() => useMicrophone());

  assert.equal(result.isRecording, false);
  assert.equal(result.isAnalyzing, false);
  assert.equal(result.timeElapsed, 0);
  assert.equal(typeof result.startRecording, "function");
  assert.equal(typeof result.stopRecording, "function");
  assert.equal(typeof result.formatTime, "function");
  assert.equal(typeof result.canvasRef, "object");
});

globalThis.loggedClientTest("useDashboardData - initial state", USE_DASHBOARD_DATA_LOCATION, async () => {
  const {
    DEFAULT_DASHBOARD_STATS,
    useDashboardData,
  } = await globalThis.loadClientModule("/src/hooks/useDashboardData.js");
  const result = renderHookSnapshot(() => useDashboardData());

  assert.deepEqual(result.pitchData, []);
  assert.deepEqual(result.dashboardStats, DEFAULT_DASHBOARD_STATS);
  assert.equal(result.isLoading, true);
  assert.equal(result.error, "");
});

globalThis.loggedClientTest("useRecordingTimer - initial state", USE_RECORDING_TIMER_LOCATION, async () => {
  const { useRecordingTimer } = await globalThis.loadClientModule(
    "/src/hooks/microphone/useRecordingTimer.js"
  );
  const result = renderHookSnapshot(() => useRecordingTimer());

  assert.equal(result.timeElapsed, 0);
  assert.equal(result.formatTime(75), "01:15");
  assert.equal(typeof result.startTimer, "function");
  assert.equal(typeof result.stopTimer, "function");
});

globalThis.loggedClientTest("useWaveformVisualizer - initial state", USE_WAVEFORM_LOCATION, async () => {
  const { useWaveformVisualizer } = await globalThis.loadClientModule(
    "/src/hooks/microphone/useWaveformVisualizer.js"
  );
  const result = renderHookSnapshot(() => useWaveformVisualizer());

  assert.equal(typeof result.canvasRef, "object");
  assert.equal(typeof result.startWaveform, "function");
  assert.equal(typeof result.stopWaveform, "function");
});
