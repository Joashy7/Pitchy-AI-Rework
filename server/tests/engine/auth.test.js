import assert from 'node:assert/strict';

import {
  hashPassword,
  toPublicUser,
  validateCredentials,
  verifyPassword,
} from '../../engine/auth.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/auth.js';

loggedTest('validateCredentials - trims input', LOCATION, () => {
  const credentials = validateCredentials({
    username: ' Joashy ',
    password: 'secret1',
  });

  assert.deepEqual(credentials, {
    username: 'Joashy',
    password: 'secret1',
  });
});

loggedTest('validateCredentials - invalid input', LOCATION, () => {
  assert.throws(
    () => validateCredentials({ username: '', password: 'secret1' }),
    (error) => error.statusCode === 400 && /Username is required/.test(error.message)
  );
  assert.throws(
    () => validateCredentials({ username: 'Joashy', password: '' }),
    (error) => error.statusCode === 400 && /Password is required/.test(error.message)
  );
  assert.throws(
    () => validateCredentials({ username: 'Joashy', password: '123' }),
    (error) => error.statusCode === 400 && /Password must be at least 6/.test(error.message)
  );
});

loggedTest('hashPassword and verifyPassword - valid hash', LOCATION, () => {
  const hash = hashPassword('secret1', {
    salt: '0123456789abcdef0123456789abcdef',
  });

  assert.match(hash, /^0123456789abcdef0123456789abcdef:/);
  assert.equal(verifyPassword('secret1', hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
});

loggedTest('verifyPassword - malformed hash', LOCATION, () => {
  assert.equal(verifyPassword('secret1', ''), false);
  assert.equal(verifyPassword('secret1', 'not-a-valid-hash'), false);
  assert.equal(verifyPassword('secret1', 'salt:nothex'), false);
});

loggedTest('toPublicUser - removes private fields', LOCATION, () => {
  assert.deepEqual(
    toPublicUser({
      userId: 'user_0',
      username: 'Joashy',
      passwordHash: 'hash',
    }),
    {
      userId: 'user_0',
      username: 'Joashy',
    }
  );
});
