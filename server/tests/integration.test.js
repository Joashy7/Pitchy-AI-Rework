import './integration/mockEngine.test.js';
import './integration/mockStorage.test.js';
import './routes/app.test.js';
import './integration/httpEngineStorage.test.js';

import {
  isDirectRun,
  runLoggedTests,
} from './helpers/loggedTest.js';

if (isDirectRun(import.meta.url)) {
  await runLoggedTests();
}
