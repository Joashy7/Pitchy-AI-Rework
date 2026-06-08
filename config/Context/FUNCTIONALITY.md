# Pitchy-AI Functionality And Architecture Context

Pitchy-AI follows a 3-tier architecture:

1. Interface: React frontend in `client/src/`.
2. Engine: Node/Express backend workflow logic in `server/` and `server/engine/`.
3. Storage: Google Sheets or local JSON demo storage in `server/storage/`.

The interface layer should never call Gemini, ElevenLabs, Google Sheets, or storage modules directly. It collects user input, calls backend HTTP routes through `client/src/lib/api.js`, and renders results returned by the engine.

The engine layer owns validation, pitch analysis workflow, AI API calls, retry/fallback behavior, and coordination with storage. `server/app.js` owns HTTP routes and upload handling. `server/engine.js` is the engine facade. Files in `server/engine/` own Gemini analysis, ElevenLabs speech, auth helpers, pitch workflow, model fallback, retries, and response normalization.

The storage layer owns persistence and data integrity. `server/storage.js` is the storage facade. Files in `server/storage/` own Google Sheets access, local demo storage, repositories, row formatting, dashboard mapping, and sheet schema.

## Core Functionalities

### Functionality A: Audio Pitch Assessment

Input:
- Live browser microphone recording uploaded as audio.

Interface:
- `client/src/pages/new-pitch.jsx`
- `client/src/hooks/useMicrophone.js`
- `client/src/hooks/microphone/`

Engine:
- Route: `POST /analyze`
- Workflow: `analyzePitchFile`
- Speech-to-text: ElevenLabs transcription
- Pitch analysis: Gemini

Storage:
- Saves a pitch row through `savePitch`.
- Google mode writes to `Sheet1`.
- Local demo mode writes to `.local/pitchy-storage.json`.

Expected output:
- Transcript text.
- Score analysis for audio pitches.
- Strong points and focus areas.
- Improved pitch transcript.
- Sentence or section-level revision regions.
- Storage result with a generated pitch ID.

Failure and edge behavior:
- Missing file returns a 400-style error.
- Unsupported audio MIME type is rejected by upload middleware.
- Oversized audio upload returns an audio-size error.
- ElevenLabs missing key, timeout, network, or non-OK response returns a controlled engine error.
- Gemini malformed JSON, missing fields, traffic errors, and timeout errors are guarded by parsing, normalization, retry, and fallback logic.

### Functionality B: Text Pitch Assessment

Input:
- Free-text pitch or presentation entered by the user.

Interface:
- `client/src/pages/new-pitch.jsx`
- `client/src/components/newPitch/ScriptPanel.jsx`

Engine:
- Route: `POST /analyze-text`
- Workflow: `analyzePitchText`
- Pitch analysis: Gemini

Storage:
- Saves a pitch row through `savePitch`.
- Text-only pitches are stored with blank score columns.

Expected output:
- Original transcript text.
- Text feedback and suggested revisions.
- Improved pitch transcript.
- Sentence or section-level revision regions.
- No score analysis. Text-only responses set `score_analysis_available` to false and include the text-analysis notice.

Failure and edge behavior:
- Empty text returns a pitch-text-required error.
- Low-content or unrelated pitch text should not invent a full pitch; the analysis should preserve or minimally clean the transcript and explain that there is not enough pitch content to assess.
- Gemini malformed JSON, missing fields, traffic errors, and timeout errors are guarded by parsing, normalization, retry, and fallback logic.

### Functionality C: Improved Pitch And Revision Feedback

Input:
- Transcript from audio or text pitch flow.

Engine:
- Gemini prompt context lives in `config/Context/ANALYSIS.md`.
- Prompt loading is handled by `server/engine/prompts.js`.
- Normalization is handled by `server/engine/analysisNormalizer.js` and helpers in `server/engine/analysis/`.

Expected output:
- `improved_transcript`
- `summary_feedback`
- `strong_points`
- `needs_focus`
- `modification_regions`
- `improvementSuggestions`

Failure and edge behavior:
- If Gemini omits fields, the backend fills safe fallback values.
- If `improved_transcript` is missing or null, the frontend shows fallback UI instead of crashing.
- If score fields are null for text-only pitches, frontend score cards are replaced by the text-analysis notice.

### Functionality D: Auth And User-Scoped Dashboard

Input:
- Username and password from login or signup.

Engine:
- Routes: `POST /signup`, `POST /login`, `GET /dashboard-data`
- Auth helpers hash and verify passwords.
- User service validates credentials and returns public user data.

Storage:
- User rows live in the `Users` sheet or local demo store.
- Pitch rows include `user_name`, `user_id`, and `pitch_id`.
- Signed-in pitch IDs use `pitch_username_0`, `pitch_username_1`, and so on.
- Anonymous pitch IDs use `pitch_0`, `pitch_1`, and so on.

Expected output:
- Login/signup returns public user data.
- Dashboard shows only pitches for the signed-in user.
- Anonymous users only see anonymous pitches.

Failure and edge behavior:
- Duplicate signup returns a username-exists error.
- Invalid login returns an invalid-credentials error.
- Malformed or expired browser auth state is cleared by frontend auth helpers.

### Functionality E: Pitch Audio Playback

Input:
- Transcript text from the analysis page.

Engine:
- Route: `POST /generate-pitch-audio`
- Workflow: `generatePitchAudio`
- Text-to-speech: ElevenLabs

Expected output:
- Data URL audio payload for browser playback.

Failure and edge behavior:
- Missing transcript returns a transcript-required error.
- ElevenLabs missing key, timeout, network, or non-OK response returns a controlled engine error and frontend fallback message.

## Storage Schema

Pitch rows are stored in `Sheet1` with these headers:

- `user_name`
- `user_id`
- `pitch_id`
- `timestamp`
- `transcribed_pitch`
- `improved_pitch`
- `analysis_score`
- `improvement_suggestion_text`
- `clarity_score`
- `persuasiveness_score`
- `confidence_score`
- `narrative_flow_score`
- `duration`

User rows are stored in `Users` with these headers:

- `user_id`
- `username`
- `password_hash`
- `created_at`
- `last_login_at`

In local demo mode, the same sheet-like data model is stored in `.local/pitchy-storage.json`.

## Environment And Configuration

Required for full Google Sheets mode:

- `GEMINI_API_KEY`
- `ELEVEN_API_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `service_account.json` at the project root, or `GOOGLE_SERVICE_ACCOUNT_PATH`
- `STORAGE_MODE=google`

Supported local demo mode:

- `STORAGE_MODE=local`, `demo`, or `mock`
- `GEMINI_API_KEY`
- `ELEVEN_API_KEY`
- Optional `LOCAL_STORAGE_PATH`

Gemini model fallback:

- Primary model comes from `GEMINI_MODEL`.
- Fallback models come from `GEMINI_MODEL_FALLBACKS`.
- Default chain uses documented model codes: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`.

## Testing Context

Tests should preserve the current output format:

`Structure tested | Function name | Location path | PASS/FAIL | Duration`

Backend tests live in `server/tests/` and are run through `server/unit.test.js`.

Frontend tests live in `client/src/tests/` and are run through `client/unit.test.js`.

Mock integration tests should avoid real Gemini, ElevenLabs, and Google Sheets calls unless `RUN_REAL_API_SMOKE_TESTS=true` is explicitly set.
