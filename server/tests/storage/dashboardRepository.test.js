import assert from 'node:assert/strict';

import {
  buildDashboardStats,
  filterPitchesForUser,
  mapPitchRowForDashboard,
} from '../../storage/dashboardMapper.js';
import { createDashboardRepository } from '../../storage/dashboardRepository.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/storage/dashboardRepository.js';
const MAPPER_LOCATION = 'server/storage/dashboardMapper.js';

const createLogger = () => ({
  logError() {},
});

loggedTest('mapPitchRowForDashboard - pitch display row', MAPPER_LOCATION, () => {
  const pitch = mapPitchRowForDashboard([
    'Joashy',
    'user_0',
    'pitch_joashy_0',
    '2026-01-01T00:00:00.000Z',
    'Original transcript with a clear opening.',
    'Improved transcript.',
    '82',
    'Good summary.',
    '80',
    '81',
    '82',
    '83',
    '0:45',
  ]);

  assert.equal(pitch.id, 'pitch_joashy_0');
  assert.equal(pitch.userName, 'Joashy');
  assert.equal(pitch.score, 82);
  assert.equal(pitch.score_analysis_available, true);
  assert.equal(pitch.duration, '0:45');
});

loggedTest('filterPitchesForUser - user isolation', MAPPER_LOCATION, () => {
  const pitches = [
    { userId: 'user_0', userName: 'Joashy' },
    { userId: 'user_1', userName: 'Other' },
    { userId: '', userName: '' },
  ];

  assert.deepEqual(filterPitchesForUser(pitches, { userId: 'user_0' }), [pitches[0]]);
  assert.deepEqual(filterPitchesForUser(pitches, {}), [pitches[2]]);
});

loggedTest('buildDashboardStats - fixed current time', MAPPER_LOCATION, () => {
  const stats = buildDashboardStats(
    [
      {
        score_analysis_available: true,
        score: 70,
        duration: '0:30',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
      {
        score_analysis_available: true,
        score: 90,
        duration: '0:45',
        timestamp: '2026-01-06T00:00:00.000Z',
      },
      {
        score_analysis_available: false,
        score: null,
        duration: '0:15',
        timestamp: '2025-12-01T00:00:00.000Z',
      },
    ],
    {
      now: Date.parse('2026-01-07T00:00:00.000Z'),
    }
  );

  assert.equal(stats.totalPitches, 3);
  assert.equal(stats.avgScore, 80);
  assert.equal(stats.totalRecordingTime, '0.0');
  assert.equal(stats.newThisWeek, 2);
  assert.equal(stats.improvementRate, '+20%');
});

loggedTest('createDashboardRepository.getDashboardData - user stats', LOCATION, async () => {
  const repository = createDashboardRepository({
    now: Date.parse('2026-01-07T00:00:00.000Z'),
    logger: createLogger(),
    pitchesRepository: {
      isPitchRow: (row) => Boolean(row[2]),
      getPitchRows: async () => [
        ['Joashy', 'user_0', 'pitch_joashy_0', '2026-01-06T00:00:00.000Z', 'Transcript', 'Improved', '90', 'Summary', '90', '90', '90', '90', '0:30'],
        ['Other', 'user_1', 'pitch_other_0', '2026-01-06T00:00:00.000Z', 'Other', 'Improved', '70', 'Summary', '70', '70', '70', '70', '0:30'],
      ],
    },
  });

  const result = await repository.getDashboardData({ userId: 'user_0' });

  assert.equal(result.success, true);
  assert.equal(result.pitches.length, 1);
  assert.equal(result.pitches[0].pitchId, 'pitch_joashy_0');
  assert.equal(result.stats.avgScore, 90);
});

loggedTest('createDashboardRepository.getDashboardData - storage failure', LOCATION, async () => {
  const repository = createDashboardRepository({
    logger: createLogger(),
    pitchesRepository: {
      isPitchRow: () => true,
      getPitchRows: async () => {
        throw new Error('Sheets unavailable');
      },
    },
  });

  const result = await repository.getDashboardData();

  assert.equal(result.success, false);
  assert.equal(result.error, 'Sheets unavailable');
  assert.deepEqual(result.pitches, []);
  assert.equal(result.stats.totalPitches, 0);
});
