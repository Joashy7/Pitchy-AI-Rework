import dotenv from 'dotenv';

import * as engine from './server/engine.js';
import { createApp } from './server/app.js';
import { logError, logInfo } from './server/logger.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

try {
  await engine.initializeEngine();
} catch (error) {
  logError('Failed to initialize engine:', error.message);
  process.exit(1);
}

const app = createApp({ engine });

app.listen(PORT, () => {
  logInfo(`AI SERVER running on http://localhost:${PORT}`);
});
