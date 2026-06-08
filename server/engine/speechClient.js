import fetch from 'node-fetch';
import FormData from 'form-data';

import { createEngineError } from './errors.js';
import { fetchWithTimeout, withRetries } from './retry.js';

const ELEVEN_TIMEOUT_MS = 30000;
const ELEVEN_TTS_VOICE_ID = 'pqHfZKP75CvOlQylNhV4';

const parseResponseJson = async (response) => {
  const rawText = await response.text();

  try {
    return JSON.parse(rawText);
  } catch {
    return { raw: rawText };
  }
};

export async function transcribeWithElevenLabs(file) {
  return withRetries(async () => {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'recording.webm',
      contentType: file.mimetype || 'audio/webm',
    });
    formData.append('model_id', 'scribe_v2');

    const response = await fetchWithTimeout(
      fetch,
      'https://api.elevenlabs.io/v1/speech-to-text',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVEN_API_KEY,
          ...formData.getHeaders(),
        },
        body: formData,
      },
      'ElevenLabs speech-to-text',
      ELEVEN_TIMEOUT_MS
    );
    const data = await parseResponseJson(response);

    console.log('ElevenLabs response:', data);

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          data.raw ||
          `Speech-to-text failed with status ${response.status}`
      );
    }

    return data;
  }, 'ElevenLabs speech-to-text');
}

export async function generateTextToSpeechAudio(text) {
  const response = await fetchWithTimeout(
    fetch,
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_TTS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
        },
      }),
    },
    'ElevenLabs text-to-speech',
    ELEVEN_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs TTS error:', errorText);
    throw createEngineError('Failed to generate pitch audio', 500);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  return {
    audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
  };
}
