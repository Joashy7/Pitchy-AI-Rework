import './tests/unit.test.js';
import './tests/integration.test.js';

import { runLoggedTests } from './tests/helpers/loggedTest.js';

await runLoggedTests();
