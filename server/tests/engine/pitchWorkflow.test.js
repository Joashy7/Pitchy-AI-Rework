import assert from 'node:assert/strict';

import {
  analyzePitchFile as defaultAnalyzePitchFile,
  analyzePitchText as defaultAnalyzePitchText,
  buildPitchStorageData,
  createPitchWorkflow,
  estimateTranscriptDurationSeconds,
  generatePitchAudio as defaultGeneratePitchAudio,
  suppressScoreAnalysis,
} from '../../engine/pitchWorkflow.js';
import { loggedTest } from '../helpers/loggedTest.js';

const LOCATION = 'server/engine/pitchWorkflow.js';

const createAnalysis = () => ({
  clarity: 80,
  persuasiveness: 70,
  confidence: 90,
  narrative_flow: 60,
  overall_score: 75,
  summary_feedback: 'Clear and credible.',
  improved_transcript: 'A sharper pitch.',
  strong_points: [],
  needs_focus: [],
  modification_regions: [],
  changes_made: [],
});

loggedTest('createPitchWorkflow.analyzePitchText - text-only pitch', LOCATION, async () => {
  let savedPitch;
  const workflow = createPitchWorkflow({
    analyzeWithGemini: async () => createAnalysis(),
    storageClient: {
      savePitch: async (pitchData) => {
        savedPitch = pitchData;
        return {
          success: true,
          pitchId: 'pitch_joashy_0',
        };
      },
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  const result = await workflow.analyzePitchText(
    'Our product helps founders practice stronger pitches.',
    {
      userId: 'user_0',
      username: 'Joashy',
    }
  );

  assert.equal(result.score_analysis_available, false);
  assert.equal(result.overall_score, null);
  assert.equal(result.analysis_mode, 'text');
  assert.equal(savedPitch.user_name, 'Joashy');
  assert.equal(savedPitch.user_id, 'user_0');
  assert.equal(savedPitch.analysis_score, '');
  assert.equal(result.storageResult.pitchId, 'pitch_joashy_0');
});

loggedTest('createPitchWorkflow.analyzePitchText - empty transcript', LOCATION, async () => {
  let analysisCalls = 0;
  let saveCalls = 0;
  const workflow = createPitchWorkflow({
    analyzeWithGemini: async () => {
      analysisCalls += 1;
      return createAnalysis();
    },
    storageClient: {
      savePitch: async () => {
        saveCalls += 1;
        return { success: true };
      },
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.analyzePitchText('   '),
    (error) => error.statusCode === 400 && /Pitch text is required/.test(error.message)
  );
  assert.equal(analysisCalls, 0);
  assert.equal(saveCalls, 0);
});

loggedTest('createPitchWorkflow.analyzePitchText - analysis failure', LOCATION, async () => {
  let saveCalls = 0;
  const workflow = createPitchWorkflow({
    analyzeWithGemini: async () => {
      throw new Error('Gemini failed');
    },
    storageClient: {
      savePitch: async () => {
        saveCalls += 1;
        return { success: true };
      },
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.analyzePitchText('A real typed pitch.'),
    /Gemini failed/
  );
  assert.equal(saveCalls, 0);
});

loggedTest('createPitchWorkflow.analyzePitchFile - audio pitch', LOCATION, async () => {
  let analyzedTranscript = '';
  let savedPitch;
  const workflow = createPitchWorkflow({
    transcribeWithElevenLabs: async () => ({
      text: 'This is the transcribed audio pitch.',
      audio_duration_secs: 38,
    }),
    analyzeWithGemini: async (transcript) => {
      analyzedTranscript = transcript;
      return createAnalysis();
    },
    storageClient: {
      savePitch: async (pitchData) => {
        savedPitch = pitchData;
        return {
          success: true,
          pitchId: 'pitch_0',
        };
      },
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  const result = await workflow.analyzePitchFile({
    buffer: Buffer.from('audio'),
    originalname: 'recording.webm',
    mimetype: 'audio/webm',
  });

  assert.equal(analyzedTranscript, 'This is the transcribed audio pitch.');
  assert.equal(result.score_analysis_available, true);
  assert.equal(result.analysis_mode, 'audio');
  assert.equal(savedPitch.duration, '0:38');
  assert.equal(result.storageResult.pitchId, 'pitch_0');
});

loggedTest('createPitchWorkflow.analyzePitchFile - missing file', LOCATION, async () => {
  let transcriptionCalls = 0;
  const workflow = createPitchWorkflow({
    transcribeWithElevenLabs: async () => {
      transcriptionCalls += 1;
      return { text: 'Should not happen' };
    },
    storageClient: {
      savePitch: async () => ({ success: true }),
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.analyzePitchFile(null),
    (error) => error.statusCode === 400 && /No audio file uploaded/.test(error.message)
  );
  assert.equal(transcriptionCalls, 0);
});

loggedTest('createPitchWorkflow.analyzePitchFile - transcription failure', LOCATION, async () => {
  let analysisCalls = 0;
  let saveCalls = 0;
  const workflow = createPitchWorkflow({
    analyzeWithGemini: async () => {
      analysisCalls += 1;
      return createAnalysis();
    },
    transcribeWithElevenLabs: async () => {
      throw new Error('Transcription failed');
    },
    storageClient: {
      savePitch: async () => {
        saveCalls += 1;
        return { success: true };
      },
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.analyzePitchFile({
      buffer: Buffer.from('audio'),
      originalname: 'recording.webm',
      mimetype: 'audio/webm',
    }),
    /Transcription failed/
  );
  assert.equal(analysisCalls, 0);
  assert.equal(saveCalls, 0);
});

loggedTest('createPitchWorkflow.generatePitchAudio - transcript validation', LOCATION, async () => {
  let ttsCalls = 0;
  const workflow = createPitchWorkflow({
    generateTextToSpeechAudio: async () => {
      ttsCalls += 1;
      return { audioUrl: 'data:audio/mpeg;base64,abc' };
    },
    storageClient: {
      savePitch: async () => ({ success: true }),
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.generatePitchAudio('   '),
    (error) => error.statusCode === 400 && /Transcript is required/.test(error.message)
  );
  assert.equal(ttsCalls, 0);

  const result = await workflow.generatePitchAudio('A pitch to read aloud.');
  assert.equal(result.audioUrl, 'data:audio/mpeg;base64,abc');
  assert.equal(ttsCalls, 1);
});

loggedTest('createPitchWorkflow.generatePitchAudio - TTS failure', LOCATION, async () => {
  const workflow = createPitchWorkflow({
    generateTextToSpeechAudio: async () => {
      throw new Error('TTS failed');
    },
    storageClient: {
      savePitch: async () => ({ success: true }),
    },
    logger: {
      logDebug() {},
      logInfo() {},
    },
  });

  await assert.rejects(
    () => workflow.generatePitchAudio('A pitch to read aloud.'),
    /TTS failed/
  );
});

loggedTest('estimateTranscriptDurationSeconds - word count', LOCATION, () => {
  assert.equal(estimateTranscriptDurationSeconds('one two three four'), 2);
});

loggedTest('analyzePitchFile, analyzePitchText, generatePitchAudio - default validation', LOCATION, async () => {
  await assert.rejects(
    () => defaultAnalyzePitchFile(null),
    (error) => error.statusCode === 400 && /No audio file uploaded/.test(error.message)
  );
  await assert.rejects(
    () => defaultAnalyzePitchText('   '),
    (error) => error.statusCode === 400 && /Pitch text is required/.test(error.message)
  );
  await assert.rejects(
    () => defaultGeneratePitchAudio(''),
    (error) => error.statusCode === 400 && /Transcript is required/.test(error.message)
  );
});

loggedTest('suppressScoreAnalysis - text-only analysis contract', LOCATION, () => {
  const analysis = suppressScoreAnalysis({
    clarity: 90,
    persuasiveness: 88,
    confidence: 87,
    narrative_flow: 86,
    overall_score: 88,
    summary_feedback: 'Good typed pitch.',
  });

  assert.equal(analysis.clarity, null);
  assert.equal(analysis.persuasiveness, null);
  assert.equal(analysis.confidence, null);
  assert.equal(analysis.narrative_flow, null);
  assert.equal(analysis.overall_score, null);
  assert.equal(analysis.score_analysis_available, false);
  assert.equal(analysis.analysis_mode, 'text');
  assert.match(analysis.score_analysis_message, /Text-based analysis/);
});

loggedTest('buildPitchStorageData - score fallbacks', LOCATION, () => {
  const payload = buildPitchStorageData(
    'Original pitch.',
    65,
    { userId: 'user_0', username: 'Joashy' },
    {
      summary_feedback: 'Good.',
      improved_transcript: 'Improved pitch.',
      clarity: null,
      persuasiveness: 70,
      confidence: 80,
      narrative_flow: 90,
      overall_score: null,
    }
  );

  assert.equal(payload.user_name, 'Joashy');
  assert.equal(payload.user_id, 'user_0');
  assert.equal(payload.analysis_score, '');
  assert.equal(payload.clarity_score, '');
  assert.equal(payload.duration, '1:05');
});
