import './engine/analysisNormalizer.test.js';
import './engine/analysisHelpers.test.js';
import './engine/analysisClient.test.js';
import './engine/auth.test.js';
import './engine/engineCore.test.js';
import './engine/geminiParser.test.js';
import './engine/geminiModels.test.js';
import './engine/pitchWorkflow.test.js';
import './engine/prompts.test.js';
import './engine/retry.test.js';
import './engine/speechClient.test.js';
import './engine/userService.test.js';
import './logger.test.js';
import './routes/appHelpers.test.js';
import './helpers/loggedTest.test.js';
import './wrappers/defaultWrappers.test.js';
import './storage/rowFormatters.test.js';
import './storage/storageFacade.test.js';
import './storage/dashboardRepository.test.js';
import './storage/googleSheetsClient.test.js';
import './storage/localSheetsClient.test.js';
import './storage/pitchesRepository.test.js';
import './storage/usersRepository.test.js';

import {
  isDirectRun,
  runLoggedTests,
} from './helpers/loggedTest.js';

if (isDirectRun(import.meta.url)) {
  await runLoggedTests();
}
