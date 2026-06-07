import fetch from 'node-fetch';
import FormData from 'form-data';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Transcribe audio using ElevenLabs Speech-to-Text
export async function transcribeWithElevenLabs(file) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`ELEVENLABS STT ATTEMPT ${attempt}`);

      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname || 'recording.webm',
        contentType: file.mimetype || 'audio/webm'
      });
      formData.append('model_id', 'scribe_v2');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVEN_API_KEY,
          ...formData.getHeaders()
        },
        body: formData
      });

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }

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
    } catch (error) {
      lastError = error;
      console.error(`ElevenLabs STT attempt ${attempt} failed:`, error.message);

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

// Analyze pitch with Gemini AI
export async function analyzeWithGemini(transcript, durationSeconds) {
  console.log('GEMINI ANALYSIS STARTED');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an expert pitch coach.

Analyze this spoken pitch transcript and return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any explanation outside the JSON.

Return EXACTLY this shape:
{
  "clarity": 0,
  "persuasiveness": 0,
  "confidence": 0,
  "narrative_flow": 0,
  "overall_score": 0,
  "summary_feedback": "",
  "strong_points": [
    {
      "timestamp": "",
      "quote": "",
      "explanation": ""
    }
  ],
  "needs_focus": [
    {
      "timestamp": "",
      "quote": "",
      "explanation": ""
    }
  ],
  "duration": ""
}

Rules:
- Scores must be integers from 0 to 100.
- strong_points must have 1 or 2 items.
- needs_focus must have 1 or 2 items.
- duration must match the total speech length as mm:ss.
- Base the analysis only on the transcript content.
- Keep explanations concise and useful.
- Use estimated timestamps if needed.

Total speech duration in seconds: ${durationSeconds}

Transcript:
${transcript}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  console.log('RAW GEMINI RESPONSE:');
  console.log(text);

  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error('GEMINI JSON PARSE ERROR:', parseError);
    console.error('CLEANED GEMINI TEXT:', cleaned);
    throw new Error('Gemini returned invalid JSON');
  }
}

// Generate improved pitch using Gemini
export async function generateImprovedPitch(transcript, analysis) {
  console.log('GENERATING IMPROVED PITCH');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an expert pitch coach. Based on the following analysis, generate an improved version of the pitch that addresses the key weaknesses.

Original Transcript:
${transcript}

Analysis:
- Clarity Score: ${analysis.clarity}/100
- Persuasiveness Score: ${analysis.persuasiveness}/100
- Confidence Score: ${analysis.confidence}/100
- Narrative Flow Score: ${analysis.narrative_flow}/100
- Overall Score: ${analysis.overall_score}/100

Areas to Focus On:
${analysis.needs_focus.map((item) => `- "${item.quote}": ${item.explanation}`).join('\n')}

Please provide an improved version of this pitch that:
1. Maintains the core message
2. Addresses the needs_focus areas
3. Improves overall clarity and persuasiveness
4. Is ready to be delivered verbally

Return ONLY the improved pitch text, no additional commentary.
`;

  const result = await model.generateContent(prompt);
  const improvedPitch = result.response.text().trim();

  console.log('IMPROVED PITCH GENERATED');
  return improvedPitch;
}

// Generate improvement suggestions
export function generateImprovementSuggestions(analysis) {
  const suggestions = {
    overall_score: analysis.overall_score,
    summary_feedback: analysis.summary_feedback,
    strong_points: analysis.strong_points,
    needs_focus: analysis.needs_focus,
    score_breakdown: {
      clarity: analysis.clarity,
      persuasiveness: analysis.persuasiveness,
      confidence: analysis.confidence,
      narrative_flow: analysis.narrative_flow,
    },
    generated_at: new Date().toISOString(),
  };

  return suggestions;
}

export default {
  transcribeWithElevenLabs,
  analyzeWithGemini,
  generateImprovedPitch,
  generateImprovementSuggestions,
};
