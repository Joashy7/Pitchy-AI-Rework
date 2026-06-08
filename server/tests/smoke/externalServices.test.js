import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/tests/smoke/externalServices.test.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../..');
const smokeEnabled = process.env.RUN_REAL_API_SMOKE_TESTS === 'true';

const requireEnvValue = (name) => {
  assert.ok(process.env[name], `${name} is required when RUN_REAL_API_SMOKE_TESTS=true`);
};

loggedTest({
  functionName: 'externalServicesSmoke - opt-in configuration',
  location: LOCATION,
  structure: 'SMOKE | External services',
}, async () => {
  if (!smokeEnabled) {
    assert.equal(smokeEnabled, false);
    return;
  }

  requireEnvValue('GEMINI_API_KEY');
  requireEnvValue('ELEVEN_API_KEY');
  requireEnvValue('GOOGLE_SHEETS_SPREADSHEET_ID');
  assert.equal(
    existsSync(resolve(projectRoot, 'service_account.json')),
    true,
    'service_account.json is required when RUN_REAL_API_SMOKE_TESTS=true'
  );
});
