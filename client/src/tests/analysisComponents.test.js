import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

const MISSING_STATE_LOCATION = "client/src/components/analysis/MissingAnalysisState.jsx";
const TEXT_NOTICE_LOCATION = "client/src/components/analysis/TextAnalysisNotice.jsx";

globalThis.loggedClientTest("MissingAnalysisState - fallback prompt", MISSING_STATE_LOCATION, async () => {
  const { default: MissingAnalysisState } = await globalThis.loadClientModule(
    "/src/components/analysis/MissingAnalysisState.jsx"
  );
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(MissingAnalysisState, {
        isPromptFading: true,
        showPrompt: true,
      })
    )
  );

  assert.match(markup, /No analysis selected/);
  assert.match(markup, /Select an analysis from Dashboard or record a new pitch/);
  assert.match(markup, /is-fading/);
  assert.match(markup, /Go to Dashboard/);
  assert.match(markup, /Record New Pitch/);
});

globalThis.loggedClientTest("TextAnalysisNotice - score notice", TEXT_NOTICE_LOCATION, async () => {
  const { default: TextAnalysisNotice } = await globalThis.loadClientModule(
    "/src/components/analysis/TextAnalysisNotice.jsx"
  );
  const markup = renderToStaticMarkup(
    React.createElement(TextAnalysisNotice, {
      message: "Text-based analysis does not provide score analysis.",
    })
  );

  assert.match(markup, /Text-Based Analysis/);
  assert.match(markup, /Text-based analysis does not provide score analysis/);
});
