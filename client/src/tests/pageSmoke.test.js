import assert from "node:assert/strict";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import { installLocalStorageMock } from "./helpers/browserMocks.js";

/**
 * Renders a route-aware component inside MemoryRouter for smoke tests.
 *
 * Args:
 * @param {React.ReactElement} element - Component element that may use React Router hooks or links.
 * @param {string} [path="/"] - Initial router path used during rendering.
 *
 * Returns:
 * @returns {string} Server-rendered static markup for assertions.
 */
const renderRouteMarkup = (element, path = "/") => (
  renderToStaticMarkup(
    React.createElement(MemoryRouter, { initialEntries: [path] }, element)
  )
);

globalThis.loggedClientTest("LandingPage - route smoke", "client/src/pages/landingpage.jsx", async () => {
  const { default: LandingPage } = await globalThis.loadClientModule("/src/pages/landingpage.jsx");
  const markup = renderRouteMarkup(React.createElement(LandingPage));

  assert.match(markup, /Master Your Pitch/);
  assert.match(markup, /Performance Workflow/);
});

globalThis.loggedClientTest("LoginPage and SignupPage - route smoke", "client/src/pages", async () => {
  const { default: LoginPage } = await globalThis.loadClientModule("/src/pages/login.jsx");
  const { default: SignupPage } = await globalThis.loadClientModule("/src/pages/signup.jsx");

  assert.match(renderRouteMarkup(React.createElement(LoginPage), "/login"), /Welcome Back/);
  assert.match(renderRouteMarkup(React.createElement(SignupPage), "/signup"), /Create Account/);
});

globalThis.loggedClientTest("NewPitch - route smoke", "client/src/pages/new-pitch.jsx", async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("pitchyUser", JSON.stringify({
      expiresAt: Date.now() + 100000,
      token: "session-token",
      userId: "user_0",
      username: "Joashy",
    }));

    const { default: NewPitch } = await globalThis.loadClientModule("/src/pages/new-pitch.jsx");
    const markup = renderRouteMarkup(React.createElement(NewPitch), "/new-pitch");

    assert.match(markup, /Hone Your Narrative/);
    assert.match(markup, /Click mic to start recording/);
    assert.match(markup, /Pitch Script/);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("Analysis and Dashboard - route smoke", "client/src/pages", async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("pitchyUser", JSON.stringify({
      expiresAt: Date.now() + 100000,
      token: "session-token",
      userId: "user_0",
      username: "Joashy",
    }));

    const { default: Analysis } = await globalThis.loadClientModule("/src/pages/analysis.jsx");
    const { default: Dashboard } = await globalThis.loadClientModule("/src/pages/dashboard.jsx");

    assert.match(renderRouteMarkup(React.createElement(Analysis), "/analysis"), /No analysis selected/);
    assert.match(renderRouteMarkup(React.createElement(Dashboard), "/dashboard"), /Pitch Archive/);
  } finally {
    restore();
  }
});

globalThis.loggedClientTest("App - route tree smoke", "client/src/App.jsx", async () => {
  const { localStorage, restore } = installLocalStorageMock();

  try {
    localStorage.setItem("pitchyUser", JSON.stringify({
      expiresAt: Date.now() + 100000,
      token: "session-token",
      userId: "user_0",
      username: "Joashy",
    }));

    const { default: App } = await globalThis.loadClientModule("/src/App.jsx");
    const markup = renderRouteMarkup(React.createElement(App), "/dashboard");

    assert.match(markup, /Pitch Archive/);
  } finally {
    restore();
  }
});
