import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import PitchPrepSidebar from "../components/newPitch/PitchPrepSidebar";
import RecordingPanel from "../components/newPitch/RecordingPanel";
import ScriptPanel from "../components/newPitch/ScriptPanel";
import AppShell from "../components/layout/AppShell";
import StatusMessage from "../components/ui/StatusMessage";
import {
  COULD_NOT_ANALYZE_PITCH_SCRIPT,
  ENTER_SCRIPT_BEFORE_ANALYZING,
} from "../constants/messages";
import { useMicrophone } from "../hooks/useMicrophone";
import { usePitchScript } from "../hooks/usePitchScript";
import { analyzeTextPitch } from "../lib/api";
import { saveAnalysisResult } from "../utils/analysisResults";
import { getAuthenticatedUser, refreshPitchSession } from "../utils/auth";
import { logError } from "../utils/logger";

/**
 * Renders the pitch recording and typed-script analysis workspace.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {JSX.Element} New pitch page with recording, script, and preparation panels.
 */
function NewPitch() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");
  const handleAnalysisComplete = useCallback(() => {
    navigate("/analysis");
  }, [navigate]);
  const handleError = useCallback((message) => {
    setStatusMessage(message);
  }, []);
  const {
    isRecording,
    timeElapsed,
    isAnalyzing,
    formatTime,
    startRecording,
    stopRecording,
    canvasRef,
  } = useMicrophone({
    onAnalysisComplete: handleAnalysisComplete,
    onError: handleError,
  });
  const {
    scriptText,
    setScriptText,
    wordCount,
    estimatedTime,
  } = usePitchScript();
  const [isTextAnalyzing, setIsTextAnalyzing] = useState(false);

  const handleAnalyzeScript = async () => {
    const transcript = scriptText.trim();

    if (!transcript) {
      setStatusMessage(ENTER_SCRIPT_BEFORE_ANALYZING);
      return;
    }

    setStatusMessage("");
    setIsTextAnalyzing(true);

    try {
      const currentUser = getAuthenticatedUser() || {};
      const result = await analyzeTextPitch({
        transcript,
        userId: currentUser.userId || "",
        username: currentUser.username || "",
      });

      saveAnalysisResult(result);
      refreshPitchSession();
      navigate("/analysis");
    } catch (error) {
      logError("Script analysis error:", error);
      setStatusMessage(error.message || COULD_NOT_ANALYZE_PITCH_SCRIPT);
    } finally {
      setIsTextAnalyzing(false);
    }
  };

  const handleScriptChange = (value) => {
    setStatusMessage("");
    setScriptText(value);
  };

  return (
    <AppShell>
      <section className="page-section">
        <div className="page-header">
          <div className="live-badge">
            <span className="live-badge__dot"></span>
            <span className="live-badge__label">Live Session</span>
          </div>

          <h2 className="page-header__title">Hone Your Narrative.</h2>

          <p className="page-header__subtitle">
            Speak your vision or draft the core components. Our AI will analyze your
            tone, pace, and value proposition after each pitch.
          </p>
        </div>

        <StatusMessage tone="error">{statusMessage}</StatusMessage>

        <div className="bento-grid">
          <div className="bento-main">
            <RecordingPanel
              isRecording={isRecording}
              timeElapsed={timeElapsed}
              isAnalyzing={isAnalyzing}
              isTextAnalyzing={isTextAnalyzing}
              formatTime={formatTime}
              startRecording={startRecording}
              stopRecording={stopRecording}
              canvasRef={canvasRef}
            />

            <ScriptPanel
              scriptText={scriptText}
              wordCount={wordCount}
              estimatedTime={estimatedTime}
              isDisabled={isRecording || isAnalyzing || isTextAnalyzing}
              isTextAnalyzing={isTextAnalyzing}
              onScriptChange={handleScriptChange}
              onAnalyzeScript={handleAnalyzeScript}
            />
          </div>

          <PitchPrepSidebar />
        </div>
      </section>
    </AppShell>
  );
}

export default NewPitch;
