import { resolve } from 'path';
import { fileURLToPath } from 'url';

const COLOR_GREEN = '\x1b[32m';
const COLOR_RED = '\x1b[31m';
const COLOR_RESET = '\x1b[0m';

const testRegistry = [];

/**
 * Infers a legacy test structure label from a source location.
 *
 * Args:
 * @param {string} location - Source path associated with the test.
 *
 * Returns:
 * @returns {string} Structure label such as "UNIT | Engine", "UNIT | Storage", "INTEGRATION | HTTP routes -> Engine", "INTEGRATION | Engine -> API clients -> Storage", "INTEGRATION | Storage facade -> Google Sheets client", or "UNIT | Backend".
 */
const getLegacyStructure = (location) => {
  if (location.includes('/engine/')) return 'UNIT | Engine';
  if (location.includes('/storage/')) return 'UNIT | Storage';
  if (location.includes('/app.js')) return 'INTEGRATION | HTTP routes -> Engine';
  if (location.includes('/engine.js')) return 'INTEGRATION | Engine -> API clients -> Storage';
  if (location.includes('/storage.js')) return 'INTEGRATION | Storage facade -> Google Sheets client';

  return 'UNIT | Backend';
};

/**
 * Normalizes a test definition into the internal registry shape.
 *
 * Args:
 * @param {string|object} definition - Legacy function name string or object with functionName, location, and structure.
 * @param {string|Function} location - Legacy location string or runTest function for object definitions.
 * @param {Function} runTest - Legacy test function.
 *
 * Returns:
 * @returns {{functionName: string, location: string, runTest: Function, structure: string}} Normalized test definition.
 */
const normalizeDefinition = (definition, location, runTest) => {
  if (typeof definition === 'object') {
    return {
      functionName: definition.functionName,
      location: definition.location,
      runTest: location,
      structure: definition.structure,
    };
  }

  return {
    functionName: definition,
    location,
    runTest,
    structure: getLegacyStructure(location),
  };
};

/**
 * Formats a duration in milliseconds for test output.
 *
 * Args:
 * @param {number} durationMs - Duration in milliseconds.
 *
 * Returns:
 * @returns {string} Duration formatted with two decimal places and "ms".
 */
const formatDuration = (durationMs) => `${durationMs.toFixed(2)}ms`;

/**
 * Wraps a test status string in terminal color codes.
 *
 * Args:
 * @param {string} status - Status label such as "PASS" or "FAIL".
 * @param {string} color - ANSI color code to apply.
 *
 * Returns:
 * @returns {string} Colorized status string followed by reset code.
 */
const formatStatus = (status, color) => `${color}${status}${COLOR_RESET}`;

/**
 * Formats a colored summary count.
 *
 * Args:
 * @param {string} label - Count label such as "PASS" or "FAIL".
 * @param {number} count - Numeric count to display.
 * @param {string} color - ANSI color code to apply.
 *
 * Returns:
 * @returns {string} Colorized "<label> <count>" string followed by reset code.
 */
const formatCount = (label, count, color) => `${color}${label} ${count}${COLOR_RESET}`;

/**
 * Registers a logged test for the custom test runner.
 *
 * Args:
 * @param {string|object} definition - Legacy test name string or structured definition with functionName, location, and structure.
 * @param {string|Function} location - Legacy source location or runTest function for object definitions.
 * @param {Function} runTest - Legacy async or sync test function.
 *
 * Returns:
 * @returns {void} Does not return a value; stores the normalized test definition in the registry.
 */
export const loggedTest = (definition, location, runTest) => {
  testRegistry.push(normalizeDefinition(definition, location, runTest));
};

/**
 * Checks whether a module is being run directly from Node.
 *
 * Args:
 * @param {string} moduleUrl - import.meta.url for the current module.
 *
 * Returns:
 * @returns {boolean} True when process.argv[1] resolves to moduleUrl; false when no argv entry exists or the module is imported by another runner.
 */
export const isDirectRun = (moduleUrl) => {
  if (!process.argv[1]) return false;

  return resolve(process.argv[1]) === fileURLToPath(moduleUrl);
};

/**
 * Runs all registered logged tests and prints one-line results.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {Promise<void>} Resolves when all tests pass; throws an Error such as "1 test failed" or "<n> tests failed" when any registered test fails.
 */
export const runLoggedTests = async () => {
  const startedAt = performance.now();
  let passCount = 0;
  let failureCount = 0;

  for (const testDefinition of testRegistry) {
    const startedAt = performance.now();
    const {
      functionName,
      location,
      runTest,
      structure,
    } = testDefinition;

    try {
      await runTest({});
      passCount += 1;
      const duration = formatDuration(performance.now() - startedAt);
      console.log(`${structure} | ${functionName} | ${location} | ${formatStatus('PASS', COLOR_GREEN)} | ${duration}`);
    } catch {
      failureCount += 1;
      const duration = formatDuration(performance.now() - startedAt);
      console.log(`${structure} | ${functionName} | ${location} | ${formatStatus('FAIL', COLOR_RED)} | ${duration}`);
    }
  }

  const totalCount = passCount + failureCount;
  const duration = formatDuration(performance.now() - startedAt);
  console.log(
    `SUMMARY | TOTAL ${totalCount} | ${formatCount('PASS', passCount, COLOR_GREEN)} | ${formatCount('FAIL', failureCount, COLOR_RED)} | DURATION ${duration}`
  );

  testRegistry.length = 0;

  if (failureCount) {
    throw new Error(`${failureCount} test${failureCount === 1 ? '' : 's'} failed`);
  }
};
