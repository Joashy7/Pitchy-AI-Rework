# Pitchy-AI

Pitchy-AI is a web-based pitch coaching app that lets users record or type a pitch, send it through an AI analysis workflow, and review feedback, suggested revisions, improved transcripts, and pitch history. The app uses a three-layer structure: the React interface collects user input, the Node/Express engine handles analysis and workflow logic, and Google Sheets storage persists users and pitch results.

<img src="client/public/images/LandingPage-Mockup.png">

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router, Vite |
| Styling | Tailwind CSS, PostCSS, custom CSS modules in `client/src/styles/` |
| Backend | Node.js ES modules, Express 5 |
| File Uploads | Multer memory uploads for recorded audio |
| AI Analysis | Google Gemini API through `@google/generative-ai` |
| Speech Services | ElevenLabs speech-to-text and text-to-speech APIs |
| Storage | Google Sheets API through `googleapis`, with optional local JSON demo storage |
| Configuration | `dotenv`, root `.env`, config files in `config/` |
| Testing | Node test runner with project-specific logged test helpers |
| Code Quality | ESLint, React Hooks lint rules |

## Repository Paths

| Required Item | Path |
| --- | --- |
| Source code directory | `client/src/` for the React frontend and `server/` for the Node/Express backend |
| Test directory | `client/src/tests/` and `server/tests/` |
| Test entry points | `client/unit.test.js`, `server/unit.test.js`, and the `npm run test` script |
| Requirement specification | `config/Context/FUNCTIONALITY.md` |
| Design and architecture guardrails | `config/Context/CONTRACT.md` |
| AI analysis prompt/design context | `config/Context/ANALYSIS.md` |
| Demo video | Coming soon. Add the final demo video link here after recording. |

## Setup

### Requirements

- Node.js: use a current LTS version compatible with ES modules and Vite.
- npm: included with Node.js.
- Google Cloud project with the Google Sheets API enabled.
- Google service account JSON credentials.
- Google Sheet for app storage.
- Gemini API key.
- ElevenLabs API key.

### Clone The Repository

Clone the project from GitHub, then move into the project folder:

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd final-project-joashgem-marcos
```

Replace `<YOUR_GITHUB_REPO_URL>` with the public GitHub URL for this repository.

### Install Dependencies

Run this once from the project root:

```bash
npm install
```

Runtime dependencies:

- `@google/generative-ai`
- `cors`
- `dotenv`
- `express`
- `form-data`
- `googleapis`
- `multer`
- `node-fetch`
- `react`
- `react-dom`
- `react-router-dom`

Development dependencies:

- `@eslint/js`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `autoprefixer`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `postcss`
- `tailwindcss`
- `vite`

### Get API Keys

The backend reads API keys from `.env`. Do not paste API keys into source code or commit them to Git.

Gemini API key:

1. Open the official Gemini API key page: https://ai.google.dev/gemini-api/docs/api-key
2. Click the Google AI Studio API Keys link on that page.
3. Create or select a Google Cloud project.
4. Create an API key.
5. Copy the key into `.env` as `GEMINI_API_KEY`.

ElevenLabs API key:

1. Open the official ElevenLabs authentication page: https://elevenlabs.io/docs/api-reference/authentication
2. Sign in or create an ElevenLabs account.
3. Open your account or workspace API key settings.
4. Create or copy an API key.
5. Copy the key into `.env` as `ELEVEN_API_KEY`.

For local demos, you still need Gemini and ElevenLabs keys because the app uses Gemini for pitch analysis and ElevenLabs for speech-to-text/text-to-speech features.

### Configure Credentials

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL_FALLBACKS=gemini-2.5-flash-lite,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-lite
ELEVEN_API_KEY=<YOUR_ELEVENLABS_API_KEY>
GOOGLE_SHEETS_SPREADSHEET_ID=<YOUR_GOOGLE_SHEET_ID>
STORAGE_MODE=google
PORT=3000
VITE_API_BASE_URL=http://localhost:3000
```

`GEMINI_MODEL` is the primary model for pitch analysis. `GEMINI_MODEL_FALLBACKS` is an optional comma-separated fallback chain used when Gemini returns traffic, timeout, network, rate-limit, or temporary server errors. The default chain is:

```text
gemini-2.5-flash -> gemini-2.5-flash-lite -> gemini-2.5-pro -> gemini-2.0-flash -> gemini-2.0-flash-lite
```

Use model codes listed in the official Gemini API model documentation: https://ai.google.dev/gemini-api/docs/models/gemini. Preview models can change or be removed, so prefer stable model codes for demos and releases.

Place your Google service account credentials file at the project root:

```text
service_account.json
```

Share the Google Sheet with the service account email and give it editor access. The app uses these sheet tabs:

- `Sheet1` for pitch records
- `Users` for user records

The app can initialize missing sheets and headers through the Google Sheets API, but the spreadsheet itself must exist and the service account must have access.

### Demo Mode Without Google Sheets

For an easier local demo, use local storage instead of Google Sheets:

```env
STORAGE_MODE=local
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL_FALLBACKS=gemini-2.5-flash-lite,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-lite
ELEVEN_API_KEY=<YOUR_ELEVENLABS_API_KEY>
PORT=3000
VITE_API_BASE_URL=http://localhost:3000
```

In `STORAGE_MODE=local`, the app does not need `service_account.json` or `GOOGLE_SHEETS_SPREADSHEET_ID`. User accounts and pitch history are saved to:

```text
.local/pitchy-storage.json
```

The `.local/` folder is ignored by Git. This mode is intended for demos and local testing, not production data storage.

## How To Run

Start the backend server from the project root:

```bash
node server.js
```

In a second terminal, start the frontend dev server from the project root:

```bash
npm run dev
```

Open the frontend URL printed by Vite, usually:

```text
http://localhost:5173
```

## Usage Examples

### 1. Record an Audio Pitch

Input:

```text
"Hi, I am building a tool that helps small business owners practice sales pitches and get instant AI feedback before meeting customers."
```

Expected output:

- A transcript of the recorded pitch.
- Score analysis for clarity, persuasiveness, confidence, narrative flow, and overall score.
- Short feedback on strong points and areas to improve.
- An improved spoken version of the pitch.
- Section-level revision suggestions.
- A saved Google Sheets pitch row with a generated pitch ID such as `pitch_username_0`.

### 2. Analyze A Text-Only Pitch

Input:

```text
"Our app helps founders rehearse investor pitches by giving them instant feedback and a cleaner rewrite."
```

Expected output:

- Text-based feedback and an improved transcript.
- Section-level suggestions for phrases or sentences that should be revised.
- No delivery score analysis. The app should show that text-based analysis does not provide score analysis.
- A saved Google Sheets pitch row marked as text-only.

### 3. Sign In And Review Dashboard History

Input:

```text
Username: <USERNAME>
Password: <PASSWORD>
```

Expected output:

- The user is logged in and can record or analyze pitches under their account.
- The dashboard shows only that user's saved pitches.
- Anonymous pitches are separate from signed-in user pitches.
- Selecting a dashboard pitch opens its saved AI feedback on the analysis page.

## Project Structure

| Path | Purpose |
| --- | --- |
| `server.js` | Starts the Node/Express backend server. |
| `server/app.js` | Defines HTTP routes, upload handling, and route error handling. |
| `server/engine.js` | Engine facade that connects app routes to engine services. |
| `server/engine/` | Gemini analysis, ElevenLabs speech/audio, pitch workflow, auth helpers, retry logic, and analysis normalization. |
| `server/storage.js` | Storage facade used by the engine. |
| `server/storage/` | Google Sheets client, repositories, row formatters, schema, and dashboard mapping. |
| `server/tests/` | Backend unit, integration, route, storage, engine, and smoke tests. |
| `client/src/` | React frontend source code. |
| `client/src/pages/` | Main app pages: landing, login, signup, dashboard, new pitch, and analysis. |
| `client/src/components/` | Reusable UI, layout, auth, dashboard, new pitch, and analysis components. |
| `client/src/hooks/` | Frontend hooks for microphone recording, pitch scripts, audio playback, and dashboard data. |
| `client/src/lib/` | Frontend API client for calling the backend engine routes. |
| `client/src/utils/` | Frontend auth/session, analysis, dashboard, logger, and storage helpers. |
| `client/src/tests/` | Frontend unit tests. |
| `config/` | Vite, ESLint, PostCSS, Tailwind, and project context configuration. |

## Useful Commands

Run all tests:

```bash
npm run test
```

Run backend tests only:

```bash
npm run test:server
```

Run frontend tests only:

```bash
npm run test:client
```

Run linting:

```bash
npm run lint
```

Build the frontend:

```bash
npm run build
```
