import './smoke/externalServices.test.js';

import {
  isDirectRun,
  runLoggedTests,
} from './helpers/loggedTest.js';

if (isDirectRun(import.meta.url)) {
  await runLoggedTests();
}
