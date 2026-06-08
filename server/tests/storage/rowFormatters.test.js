import assert from 'node:assert/strict';

import {
  durationToSeconds,
  formatDate,
  hasSheetValue,
  isHeaderValue,
  normalizeDuration,
  normalizeIdentifierPart,
  normalizeUsername,
  toNumber,
  truncateText,
} from '../../storage/rowFormatters.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/rowFormatters.js';

loggedTest('normalizeUsername and normalizeIdentifierPart - sheet-safe text', LOCATION, () => {
  assert.equal(normalizeUsername('  Joashy Gem  '), 'Joashy Gem');
  assert.equal(normalizeIdentifierPart(' Joashy Gem + Pitch! '), 'joashy_gem_pitch');
  assert.equal(normalizeIdentifierPart('***'), '');
});

loggedTest('isHeaderValue and hasSheetValue - sheet cell detection', LOCATION, () => {
  assert.equal(isHeaderValue(' Pitch_ID ', 'pitch_id'), true);
  assert.equal(isHeaderValue('pitch id', 'pitch_id'), false);
  assert.equal(hasSheetValue(0), true);
  assert.equal(hasSheetValue('  '), false);
});

loggedTest('toNumber - numeric fallback', LOCATION, () => {
  assert.equal(toNumber('42'), 42);
  assert.equal(toNumber('', 7), 0);
  assert.equal(toNumber('not-a-number', 7), 7);
});

loggedTest('truncateText - whitespace and ellipsis', LOCATION, () => {
  assert.equal(truncateText('  A   short   pitch  ', 80), 'A short pitch');
  assert.equal(truncateText('This transcript is too long for the dashboard card.', 20), 'This transcript...');
  assert.equal(truncateText('', 20), '');
});

loggedTest('formatDate - valid and invalid timestamps', LOCATION, () => {
  assert.equal(formatDate(''), 'Unknown date');
  assert.equal(formatDate('not-a-date'), 'not-a-date');
  assert.equal(formatDate('2026-01-15T12:00:00.000Z'), 'Jan 15, 2026');
});

loggedTest('normalizeDuration and durationToSeconds - duration parsing', LOCATION, () => {
  assert.equal(normalizeDuration(' 0:45 '), '0:45');
  assert.equal(normalizeDuration(''), 'N/A');
  assert.equal(durationToSeconds('75'), 75);
  assert.equal(durationToSeconds('1:05'), 65);
  assert.equal(durationToSeconds('1:02:03'), 3723);
  assert.equal(durationToSeconds('N/A'), 0);
  assert.equal(durationToSeconds('bad:duration'), 0);
});
