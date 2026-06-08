import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import {
  loggedTest,
  runLoggedTests,
} from "../server/tests/helpers/loggedTest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const vite = await createServer({
  appType: "custom",
  configFile: resolve(projectRoot, "config/vite.config.js"),
  logLevel: "error",
  server: {
    middlewareMode: true,
  },
});

globalThis.loadClientModule = (modulePath) => vite.ssrLoadModule(modulePath);
globalThis.loggedClientTest = (functionName, location, runTest) => {
  loggedTest({
    functionName,
    location,
    structure: "UNIT | Frontend",
  }, runTest);
};

try {
  await import("./src/tests/auth.test.js");
  await import("./src/tests/analysisViewModel.test.js");
  await import("./src/tests/dashboardViewModel.test.js");
  await import("./src/tests/analysisComponents.test.js");
  await import("./src/tests/api.test.js");
  await runLoggedTests();
} finally {
  await vite.close();
  delete globalThis.loadClientModule;
  delete globalThis.loggedClientTest;
}
