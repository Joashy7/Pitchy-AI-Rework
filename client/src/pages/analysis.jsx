import React, { useEffect, useState } from "react";

import ImprovedPitchCard from "../components/analysis/ImprovedPitchCard";
import MissingAnalysisState from "../components/analysis/MissingAnalysisState";
import RevisionMap from "../components/analysis/RevisionMap";
import ScoreOverview from "../components/analysis/ScoreOverview";
import TextAnalysisNotice from "../components/analysis/TextAnalysisNotice";
import TranscriptFeedback from "../components/analysis/TranscriptFeedback";
import AppShell from "../components/layout/AppShell";
import StatusMessage from "../components/ui/StatusMessage";
import { usePitchAudio } from "../hooks/usePitchAudio";
import { readStoredAnalysis } from "../utils/analysisResults";
import { toAnalysisViewModel } from "../utils/analysisViewModel";

function Analysis() {
  const [storedAnalysis] = useState(readStoredAnalysis);
  const [showMissingAnalysisPrompt, setShowMissingAnalysisPrompt] = useState(
    Boolean(storedAnalysis.error)
  );
  const [isMissingAnalysisPromptFading, setIsMissingAnalysisPromptFading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const pitchAudio = usePitchAudio({ onError: setAudioError });
  const improvedPitchAudio = usePitchAudio({ onError: setAudioError });
  const analysis = toAnalysisViewModel(storedAnalysis.data);

  useEffect(() => {
    if (!storedAnalysis.error) return undefined;

    const fadeTimeoutId = setTimeout(() => {
      setIsMissingAnalysisPromptFading(true);
    }, 4200);
    const hideTimeoutId = setTimeout(() => {
      setShowMissingAnalysisPrompt(false);
    }, 5200);

    return () => {
      clearTimeout(fadeTimeoutId);
      clearTimeout(hideTimeoutId);
    };
  }, [storedAnalysis.error]);

  if (!analysis) {
    return (
      <AppShell activePage="analysis">
        <MissingAnalysisState
          showPrompt={showMissingAnalysisPrompt}
          isPromptFading={isMissingAnalysisPromptFading}
        />
      </AppShell>
    );
  }

  return (
    <AppShell activePage="analysis">
      <section className="page-section">
        <div className="page-header">
          <h2 className="page-header__title">Your Pitch Analysis</h2>
          <p className="page-header__subtitle">{analysis.summaryFeedback}</p>
        </div>

        <StatusMessage tone="error">{audioError}</StatusMessage>

        {analysis.scoreAnalysisAvailable ? (
          <ScoreOverview scores={analysis.scores} />
        ) : (
          <TextAnalysisNotice message={analysis.scoreAnalysisMessage} />
        )}

        <TranscriptFeedback
          transcript={analysis.transcript}
          strongPoints={analysis.strongPoints}
          needsFocus={analysis.needsFocus}
          onHearPitch={() => {
            setAudioError("");
            pitchAudio.playPitchAudio(analysis.transcript);
          }}
          isGeneratingAudio={pitchAudio.isGeneratingAudio}
        />

        <RevisionMap regions={analysis.modificationRegions} />

        <ImprovedPitchCard
          improvedPitch={analysis.improvedPitch}
          onHearImprovedPitch={() => {
            setAudioError("");
            improvedPitchAudio.playPitchAudio(analysis.improvedPitch);
          }}
          isGeneratingImprovedAudio={improvedPitchAudio.isGeneratingAudio}
        />
      </section>
    </AppShell>
  );
}

export default Analysis;
