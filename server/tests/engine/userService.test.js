import assert from 'node:assert/strict';

import {
  createUserService,
  loginUser as defaultLoginUser,
  signUpUser as defaultSignUpUser,
} from '../../engine/userService.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/userService.js';

loggedTest('createUserService.signUpUser - success', LOCATION, async () => {
  let createdUser;
  const service = createUserService({
    hashPasswordFn: (password) => `hashed:${password}`,
    storageClient: {
      createUser: async (user) => {
        createdUser = user;
        return {
          success: true,
          user: {
            userId: 'user_0',
            username: user.username,
            passwordHash: user.passwordHash,
          },
        };
      },
    },
  });

  const result = await service.signUpUser({
    username: ' Joashy ',
    password: 'secret1',
  });

  assert.equal(createdUser.username, 'Joashy');
  assert.equal(createdUser.passwordHash, 'hashed:secret1');
  assert.equal(result.user.userId, 'user_0');
  assert.equal(result.user.passwordHash, undefined);
});

loggedTest('createUserService.signUpUser - duplicate username', LOCATION, async () => {
  const service = createUserService({
    hashPasswordFn: () => 'hash',
    storageClient: {
      createUser: async () => ({
        success: false,
        error: 'Username already exists',
      }),
    },
  });

  await assert.rejects(
    () => service.signUpUser({ username: 'Joashy', password: 'secret1' }),
    (error) => error.statusCode === 409 && /Username already exists/.test(error.message)
  );
});

loggedTest('createUserService.loginUser - success', LOCATION, async () => {
  let updatedUserId = '';
  const service = createUserService({
    verifyPasswordFn: () => true,
    storageClient: {
      findUserByUsername: async () => ({
        userId: 'user_0',
        username: 'Joashy',
        passwordHash: 'hash',
      }),
      updateUserLastLogin: async (userId) => {
        updatedUserId = userId;
        return {
          success: true,
        };
      },
    },
  });

  const result = await service.loginUser({
    username: 'Joashy',
    password: 'secret1',
  });

  assert.equal(updatedUserId, 'user_0');
  assert.deepEqual(result, {
    success: true,
    user: {
      userId: 'user_0',
      username: 'Joashy',
    },
  });
});

loggedTest('createUserService.loginUser - invalid credentials', LOCATION, async () => {
  const service = createUserService({
    verifyPasswordFn: () => false,
    storageClient: {
      findUserByUsername: async () => ({
        userId: 'user_0',
        username: 'Joashy',
        passwordHash: 'hash',
      }),
      updateUserLastLogin: async () => ({ success: true }),
    },
  });

  await assert.rejects(
    () => service.loginUser({ username: 'Joashy', password: 'secret1' }),
    (error) => error.statusCode === 401 && /Invalid username or password/.test(error.message)
  );
});

loggedTest('signUpUser and loginUser - default validation', LOCATION, async () => {
  await assert.rejects(
    () => defaultSignUpUser({ username: '', password: '' }),
    (error) => error.statusCode === 400 && /Username is required/.test(error.message)
  );
  await assert.rejects(
    () => defaultLoginUser({ username: 'Joashy', password: '' }),
    (error) => error.statusCode === 400 && /Password is required/.test(error.message)
  );
});
