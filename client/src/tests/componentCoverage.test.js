import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import {
  installLocalStorageMock,
} from "./helpers/browserMocks.js";

/**
 * Wraps a component in MemoryRouter for server-rendered component tests.
 *
 * Args:
 * @param {React.ReactElement} element - Component element that may use router APIs.
 *
 * Returns:
 * @returns {React.ReactElement} Element wrapped in MemoryRouter.
 */
const wrapRouter = (element) => React.createElement(MemoryRouter, null, element);

globalThis.loggedClientTest("StatusMessage - empty and error states", "client/src/components/ui/StatusMessage.jsx", async () => {
  const { default: StatusMessage } = await globalThis.loadClientModule(
    "/src/components/ui/StatusMessage.jsx"
  );

  assert.equal(renderToStaticMarkup(React.createElement(StatusMessage, null)), "");
  assert.match(
    renderToStaticMarkup(React.createElement(StatusMessage, { tone: "error" }, "Problem")),
    /status-message--error/
  );
});

globalThis.loggedClientTest("ScoreOverview - renders scores", "client/src/components/analysis/ScoreOverview.jsx", async () => {
  const { default: ScoreOverview } = await globalThis.loadClientModule(
    "/src/components/analysis/ScoreOverview.jsx"
  );
  const markup = renderToStaticMarkup(React.createElement(ScoreOverview, {
    scores: {
      clarity: 90,
      confidence: 70,
      narrativeFlow: 85,
      overall: 88,
      persuasiveness: 80,
    },
  }));

  assert.match(markup, /Overall Score/);
  assert.match(markup, /Clarity/);
  assert.match(markup, /88/);
});

globalThis.loggedClientTest("RevisionMap - empty and populated states", "client/src/components/analysis/RevisionMap.jsx", async () => {
  const { default: RevisionMap } = await globalThis.loadClientModule(
    "/src/components/analysis/RevisionMap.jsx"
  );

  assert.equal(renderToStaticMarkup(React.createElement(RevisionMap, { regions: [] })), "");

  const markup = renderToStaticMarkup(React.createElement(RevisionMap, {
    regions: [{
      issue: "Too broad",
      original: "We help people.",
      reason: "Specificity improves clarity.",
      section: "Opening",
      suggested_edit: "We help founders practice investor pitches.",
      timestamp: "00:04",
    }],
  }));

  assert.match(markup, /Sentence-Level Revision Map/);
  assert.match(markup, /We help founders practice investor pitches/);
});

globalThis.loggedClientTest("ImprovedPitchCard and TranscriptFeedback - render pitch text", "client/src/components/analysis", async () => {
  const { default: ImprovedPitchCard } = await globalThis.loadClientModule(
    "/src/components/analysis/ImprovedPitchCard.jsx"
  );
  const { default: TranscriptFeedback } = await globalThis.loadClientModule(
    "/src/components/analysis/TranscriptFeedback.jsx"
  );
  const improvedMarkup = renderToStaticMarkup(React.createElement(ImprovedPitchCard, {
    improvedPitch: "Sharper improved pitch.",
    isGeneratingImprovedAudio: false,
    onHearImprovedPitch() {},
  }));
  const transcriptMarkup = renderToStaticMarkup(React.createElement(TranscriptFeedback, {
    isGeneratingAudio: false,
    needsFocus: [{ explanation: "Add proof.", quote: "Trust us.", timestamp: "00:10" }],
    onHearPitch() {},
    strongPoints: [{ explanation: "Clear audience.", quote: "Founders.", timestamp: "00:01" }],
    transcript: "Original pitch.",
  }));

  assert.match(improvedMarkup, /Sharper improved pitch/);
  assert.match(transcriptMarkup, /Original pitch/);
  assert.match(transcriptMarkup, /Improvement Area/);
});

globalThis.loggedClientTest("DashboardStats and PitchHistoryTable - render dashboard data", "client/src/components/dashboard", async () => {
  const { default: DashboardStats } = await globalThis.loadClientModule(
    "/src/components/dashboard/DashboardStats.jsx"
  );
  const { default: PitchHistoryTable } = await globalThis.loadClientModule(
    "/src/components/dashboard/PitchHistoryTable.jsx"
  );
  const statsMarkup = renderToStaticMarkup(React.createElement(DashboardStats, {
    stats: {
      avgScore: 88,
      improvementLabel: "Improving",
      improvementRate: "+8%",
      newThisWeek: 1,
      scoreBadge: "Strong",
      totalPitches: 2,
      totalRecordingTime: "0.2",
    },
  }));
  const tableMarkup = renderToStaticMarkup(wrapRouter(React.createElement(PitchHistoryTable, {
    currentPage: 1,
    error: "",
    isLoading: false,
    onNextPage() {},
    onPageChange() {},
    onPreviousPage() {},
    onViewAnalysis() {},
    pitches: [
      {
        date: "Jun 1",
        description: "Recorded pitch",
        duration: "00:30",
        id: "pitch_0",
        name: "Demo",
        score: 88,
        score_analysis_available: true,
      },
      {
        date: "Jun 2",
        description: "Typed pitch",
        duration: "00:20",
        id: "pitch_1",
        name: "Text",
        score: null,
        score_analysis_available: false,
      },
    ],
    showingEnd: 2,
    showingStart: 1,
    totalItems: 2,
    totalPages: 1,
    visiblePages: [1],
  })));

  assert.match(statsMarkup, /Total Pitches/);
  assert.match(statsMarkup, /Improving/);
  assert.match(tableMarkup, /Recorded/);
  assert.match(tableMarkup, /Text Only/);
  assert.match(tableMarkup, /View Analysis/);
});

globalThis.loggedClientTest("ScriptPanel, RecordingPanel, and PitchPrepSidebar - render new pitch UI", "client/src/components/newPitch", async () => {
  const { default: ScriptPanel } = await globalThis.loadClientModule(
    "/src/components/newPitch/ScriptPanel.jsx"
  );
  const { default: RecordingPanel } = await globalThis.loadClientModule(
    "/src/components/newPitch/RecordingPanel.jsx"
  );
  const { default: PitchPrepSidebar } = await globalThis.loadClientModule(
    "/src/components/newPitch/PitchPrepSidebar.jsx"
  );
  const scriptMarkup = renderToStaticMarkup(React.createElement(ScriptPanel, {
    estimatedTime: "0:20",
    isDisabled: false,
    isTextAnalyzing: false,
    onAnalyzeScript() {},
    onScriptChange() {},
    scriptText: "Typed pitch",
    wordCount: 2,
  }));
  const recordingMarkup = renderToStaticMarkup(React.createElement(RecordingPanel, {
    canvasRef: { current: null },
    formatTime: () => "00:03",
    isAnalyzing: false,
    isRecording: true,
    isTextAnalyzing: false,
    startRecording() {},
    stopRecording() {},
    timeElapsed: 3,
  }));
  const prepMarkup = renderToStaticMarkup(React.createElement(PitchPrepSidebar));

  assert.match(scriptMarkup, /Word Count: 2/);
  assert.match(recordingMarkup, /Recording\.\.\. click stop/);
  assert.match(prepMarkup, /Pitching Checklist/);
});

globalThis.loggedClientTest("AuthForm, AppShell, Sidebar, TopBar, and MarketingTopBar - render layout", "client/src/components/layout", async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("pitchyUser", JSON.stringify({
      expiresAt: Date.now() + 100000,
      token: "session-token",
      userId: "user_0",
      username: "Joashy",
    }));

    const { default: AuthForm } = await globalThis.loadClientModule("/src/components/auth/AuthForm.jsx");
    const { default: AppShell } = await globalThis.loadClientModule("/src/components/layout/AppShell.jsx");
    const { default: MarketingTopBar } = await globalThis.loadClientModule("/src/components/layout/MarketingTopBar.jsx");
    const { default: Sidebar } = await globalThis.loadClientModule("/src/components/layout/Sidebar.jsx");
    const { default: TopBar } = await globalThis.loadClientModule("/src/components/layout/TopBar.jsx");

    const authMarkup = renderToStaticMarkup(wrapRouter(React.createElement(AuthForm, {
      error: "Invalid login",
      isSubmitting: false,
      onSubmit() {},
      secondaryLabel: "Create Account",
      secondaryTo: "/signup",
      socialProviders: [{ icon: React.createElement("span", null, "G"), label: "Google" }],
      submitLabel: "Login",
      submittingLabel: "Logging in...",
      subtitle: "Welcome back.",
      title: "Login",
    })));
    const shellMarkup = renderToStaticMarkup(wrapRouter(React.createElement(AppShell, {
      activePage: "dashboard",
      onSearchChange() {},
      searchValue: "",
    }, React.createElement("section", null, "Shell content"))));
    const sidebarMarkup = renderToStaticMarkup(wrapRouter(React.createElement(Sidebar, {
      activePage: "dashboard",
    })));
    const topBarMarkup = renderToStaticMarkup(wrapRouter(React.createElement(TopBar, {
      onSearchChange() {},
      searchValue: "",
    })));
    const marketingMarkup = renderToStaticMarkup(wrapRouter(React.createElement(MarketingTopBar)));

    assert.match(authMarkup, /Login/);
    assert.match(authMarkup, /Google/);
    assert.match(shellMarkup, /Shell content/);
    assert.match(sidebarMarkup, /Logout/);
    assert.match(topBarMarkup, /User profile/);
    assert.match(marketingMarkup, /Start Pitching/);
  } finally {
    restore();
  }
});
