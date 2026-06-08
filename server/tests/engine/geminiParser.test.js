import assert from 'node:assert/strict';

import {
  cleanGeminiJsonText,
  parseGeminiJson,
} from '../../engine/geminiParser.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/geminiParser.js';

loggedTest('parseGeminiJson - fenced JSON', LOCATION, () => {
  const parsed = parseGeminiJson(
    '```json\n{"clarity":80,"summary_feedback":"Good"}\n```',
    { logDebug() {}, logError() {} }
  );

  assert.equal(parsed.clarity, 80);
  assert.equal(parsed.summary_feedback, 'Good');
});

loggedTest('cleanGeminiJsonText - prose wrapper', LOCATION, () => {
  const cleaned = cleanGeminiJsonText('Here is the JSON:\n{"overall_score":72}\nThanks');

  assert.equal(cleaned, '{"overall_score":72}');
});

loggedTest('parseGeminiJson - malformed JSON', LOCATION, () => {
  assert.throws(
    () => parseGeminiJson('{not json}', { logDebug() {}, logError() {} }),
    /Gemini returned invalid JSON/
  );
});
