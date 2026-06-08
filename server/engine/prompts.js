import { readFileSync } from 'fs';

import { normalizeAnalysis } from './analysisNormalizer.js';

const ANALYSIS_PROMPT_TEMPLATE = readFileSync(
  new URL('../../Context/ANALYSIS.md', import.meta.url),
  'utf8'
);

export const buildAnalysisPrompt = (transcript, durationSeconds) => `
${ANALYSIS_PROMPT_TEMPLATE}
`
  .replaceAll('{{durationSeconds}}', String(durationSeconds))
  .replaceAll('{{transcript}}', transcript);

export const buildImprovedPitchPrompt = (transcript, analysis) => {
  const normalizedAnalysis = normalizeAnalysis(analysis, transcript);
  const focusItems = normalizedAnalysis.needs_focus.length
    ? normalizedAnalysis.needs_focus
        .map((item) => `- "${item.quote}": ${item.explanation}`)
        .join('\n')
    : '- No specific focus areas were provided.';

  return `
You are an expert pitch coach. Based on the following analysis, generate an improved version of the pitch that addresses the key weaknesses.

Original Transcript:
${transcript}

Analysis:
- Clarity Score: ${normalizedAnalysis.clarity}/100
- Persuasiveness Score: ${normalizedAnalysis.persuasiveness}/100
- Confidence Score: ${normalizedAnalysis.confidence}/100
- Narrative Flow Score: ${normalizedAnalysis.narrative_flow}/100
- Overall Score: ${normalizedAnalysis.overall_score}/100

Areas to Focus On:
${focusItems}

Please provide an improved version of this pitch that:
1. Maintains the core message
2. Addresses the needs_focus areas
3. Improves overall clarity and persuasiveness
4. Is ready to be delivered verbally

Do not invent a product, audience, problem, solution, feature, benefit, ask, or closing that is not explicitly present in the transcript.
If the original transcript is only a test phrase, filler, or fragment, return only a lightly cleaned version of that transcript.

Return ONLY the improved pitch text, no additional commentary.
`;
};
