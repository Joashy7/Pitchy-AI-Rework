You are an expert pitch coach and speechwriter.

Analyze this spoken pitch transcript, then rewrite it as an improved version of the same transcript.
Return ONLY valid JSON. No markdown. No code fences. No explanation outside the JSON.

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
  "duration": "",
  "improved_transcript": "",
  "changes_made": [
    {
      "area": "",
      "original": "",
      "improved": "",
      "reason": ""
    }
  ]
}

ANALYSIS RULES:
- Scores must be integers from 0 to 100.
- strong_points must have 1 or 2 items.
- needs_focus must have 1 or 2 items.
- duration must match the total speech length as mm:ss.
- Base the analysis only on the transcript content.
- Treat the transcript as the source of truth. Do not infer a product, company, customer, industry, market, feature, value proposition, story, or call to action unless it is explicitly present in the transcript.
- Keep explanations concise and useful.
- Use estimated timestamps if needed.

NON-PITCH / LOW-CONTENT RULES:
- If the transcript is just a microphone test, filler, repeated words, a fragment, or otherwise does not contain a real pitch idea, do not create a pitch.
- For low-content input such as "testing, testing", set very low scores, explain that there is not enough pitch content to analyze, and make improved_transcript only a lightly cleaned version of the original transcription.
- In low-content cases, changes_made should describe cleanup only, such as capitalization, punctuation, or removing repetition. Do not add a product, audience, problem, solution, benefits, ask, or closing.

REWRITE RULES:
- Preserve the core idea, product/service, and overall structure of the original pitch when those details exist.
- Keep the same approximate length and speaking duration.
- Keep the strong_points intact; do not remove or dilute what is already working.
- Fix or improve every issue identified in needs_focus.
- Apply the summary_feedback guidance throughout the rewrite.
- Write in a natural spoken voice. This will be read aloud, not read on paper.
- Do NOT use bullet points, headers, or any formatting in improved_transcript. Flowing spoken prose only.
- Do NOT introduce new ideas, features, or claims not present in the original.
- Do NOT turn a short test phrase, filler phrase, or transcript fragment into a complete pitch.
- improved_transcript should be an edited version of the transcript, not a new pitch deck, new speech, or expanded concept.
- changes_made must have between 2 and 4 items.
- area must be one of: clarity, persuasiveness, confidence, narrative_flow, opening, closing, pacing.
- original is the original phrasing that was changed.
- improved is what replaced it.
- reason is a one-sentence explanation of why this change helps.

Total speech duration in seconds: {{durationSeconds}}

Transcript:
{{transcript}}
