import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server default wrapper exports';
const projectRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const moduleUrl = (relativePath) => pathToFileURL(join(projectRoot, relativePath)).href;

const runIsolatedModuleScript = (script, env) => {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', script],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...env,
      },
    }
  );

  assert.equal(
    result.status,
    0,
    [
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n')
  );
};

const withTempLocalStorage = async (callback) => {
  const tempDir = await mkdtemp(join(tmpdir(), 'pitchy-wrapper-storage-'));
  const storagePath = join(tempDir, 'storage.json');

  try {
    await callback(storagePath);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
};

loggedTest({
  functionName: 'storage default wrappers - local mode flow',
  location: 'server/storage.js',
  structure: 'UNIT | Default wrappers',
}, async () => {
  await withTempLocalStorage(async (storagePath) => {
    runIsolatedModuleScript(`
      import assert from 'node:assert/strict';

      const storage = await import(${JSON.stringify(moduleUrl('server/storage.js'))});

      await storage.initializeAuth();
      const createdUser = await storage.createUser({
        username: 'WrapperUser',
        passwordHash: 'hash',
      });
      const foundUser = await storage.findUserByUsername('wrapperuser');
      const loginUpdate = await storage.updateUserLastLogin(createdUser.user.userId);
      const savedPitch = await storage.savePitch({
        analysis_score: 82,
        duration: '0:30',
        improvedPitch: 'Improved wrapper pitch.',
        transcribed_pitch: 'Original wrapper pitch.',
        user_id: createdUser.user.userId,
        user_name: createdUser.user.username,
      });
      const dashboard = await storage.getDashboardData(createdUser.user);

      assert.equal(createdUser.user.userId, 'user_0');
      assert.equal(foundUser.username, 'WrapperUser');
      assert.equal(loginUpdate.success, true);
      assert.equal(savedPitch.pitchId, 'pitch_wrapperuser_0');
      assert.equal(dashboard.success, true);
      assert.equal(dashboard.pitches.length, 1);
      assert.equal(dashboard.pitches[0].pitchId, 'pitch_wrapperuser_0');
    `, {
      ELEVEN_API_KEY: '',
      GEMINI_API_KEY: '',
      LOCAL_STORAGE_PATH: storagePath,
      STORAGE_MODE: 'mock',
    });
  });
});

loggedTest({
  functionName: 'engine default wrappers - local mode auth and dashboard',
  location: 'server/engine.js',
  structure: 'UNIT | Default wrappers',
}, async () => {
  await withTempLocalStorage(async (storagePath) => {
    runIsolatedModuleScript(`
      import assert from 'node:assert/strict';

      const engine = await import(${JSON.stringify(moduleUrl('server/engine.js'))});

      await engine.initializeEngine();
      const signup = await engine.signUpUser({
        username: 'EngineWrapper',
        password: 'secret1',
      });
      const login = await engine.loginUser({
        username: 'EngineWrapper',
        password: 'secret1',
      });
      const dashboard = await engine.getDashboardData(login.user);

      assert.equal(signup.success, true);
      assert.equal(signup.user.userId, 'user_0');
      assert.equal(login.success, true);
      assert.equal(login.user.username, 'EngineWrapper');
      assert.equal(dashboard.success, true);
      assert.equal(dashboard.stats.totalPitches, 0);
    `, {
      ELEVEN_API_KEY: '',
      GEMINI_API_KEY: '',
      LOCAL_STORAGE_PATH: storagePath,
      STORAGE_MODE: 'mock',
    });
  });
});

loggedTest({
  functionName: 'analyzeWithGemini - default missing API key',
  location: 'server/engine/analysisClient.js',
  structure: 'UNIT | Default wrappers',
}, () => {
  runIsolatedModuleScript(`
    import assert from 'node:assert/strict';

    const { analyzeWithGemini } = await import(${JSON.stringify(moduleUrl('server/engine/analysisClient.js'))});

    await assert.rejects(
      () => analyzeWithGemini('A pitch transcript.', 10),
      /GEMINI_API_KEY/
    );
  `, {
    GEMINI_API_KEY: '',
  });
});

loggedTest({
  functionName: 'googleSheets default wrappers - env-only safe paths',
  location: 'server/storage/googleSheetsClient.js',
  structure: 'UNIT | Default wrappers',
}, async () => {
  await withTempLocalStorage(async (storagePath) => {
    runIsolatedModuleScript(`
      import assert from 'node:assert/strict';

      const sheetsClient = await import(${JSON.stringify(moduleUrl('server/storage/googleSheetsClient.js'))});

      assert.equal(sheetsClient.getSpreadsheetId(), 'sheet_wrapper_test');
      await assert.rejects(
        () => sheetsClient.initializeAuth(),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.getSheetsApi(),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.updateSheet('sheet_wrapper_test', 'Users!A1', ['value']),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.appendToSheet('sheet_wrapper_test', 'Users!A:E', ['value']),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.getSheetValues('sheet_wrapper_test', 'Users!A:E'),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.ensureSheet('sheet_wrapper_test', 'Users', ['user_id']),
        /ENOENT/
      );
      await assert.rejects(
        () => sheetsClient.findRowByValue('sheet_wrapper_test', 'Users', 'A', 'user_0'),
        /ENOENT/
      );
    `, {
      GOOGLE_SERVICE_ACCOUNT_PATH: join(storagePath, 'missing-service-account.json'),
      GOOGLE_SHEETS_SPREADSHEET_ID: 'sheet_wrapper_test',
    });
  });
});
