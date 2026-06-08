import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { loggedTest } from './loggedTest.js';

const LOCATION = 'server/tests/helpers/loggedTest.js';

const importIsolatedLoggedTest = async () => {
  const moduleUrl = new URL(`./loggedTest.js?test=${Date.now()}-${Math.random()}`, import.meta.url);
  return import(moduleUrl.href);
};

loggedTest('isDirectRun - direct module detection', LOCATION, async () => {
  const { isDirectRun } = await importIsolatedLoggedTest();
  const helperUrl = new URL('./loggedTest.js', import.meta.url);
  const originalArgvEntry = process.argv[1];

  try {
    process.argv[1] = fileURLToPath(helperUrl);
    assert.equal(isDirectRun(helperUrl.href), true);

    process.argv[1] = fileURLToPath(import.meta.url);
    assert.equal(isDirectRun(helperUrl.href), false);
  } finally {
    process.argv[1] = originalArgvEntry;
  }
});

loggedTest('runLoggedTests - isolated pass summary', LOCATION, async () => {
  const {
    loggedTest: isolatedLoggedTest,
    runLoggedTests,
  } = await importIsolatedLoggedTest();
  const originalLog = console.log;
  const lines = [];

  console.log = (line) => {
    lines.push(line);
  };

  try {
    isolatedLoggedTest('exampleFunction - happy path', 'server/example.js', () => {
      assert.equal(1 + 1, 2);
    });

    await runLoggedTests();
  } finally {
    console.log = originalLog;
  }

  assert.equal(lines.length, 2);
  assert.match(lines[0], /UNIT \| Backend \| exampleFunction - happy path \| server\/example\.js \| .*PASS/);
  assert.match(lines[1], /SUMMARY \| TOTAL 1 \| .*PASS 1.*FAIL 0.*DURATION/);
});
