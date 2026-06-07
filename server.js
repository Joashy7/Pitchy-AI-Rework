import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

import * as engine from "./engine.js";
import * as storage from "./storage.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Initialize Google Sheets API on startup
const initializeStorage = async () => {
  try {
    await storage.initializeAuth();
    console.log("✓ Storage system initialized successfully");
  } catch (error) {
    console.error("✗ Failed to initialize storage system:", error.message);
    process.exit(1);
  }
};

// Initialize before starting server
await initializeStorage();

app.get("/", (req, res) => {
  res.send("Pitchy AI Server is running");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("ANALYZE ROUTE HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Step 1: Transcribe audio
    const sttData = await engine.transcribeWithElevenLabs(req.file);
    const transcript = sttData.text || "No transcript returned";

    console.log("TRANSCRIPT READY FOR ANALYSIS:");
    console.log(transcript);

    // Step 2: Analyze with Gemini
    const analysis = await engine.analyzeWithGemini(
      transcript,
      sttData.audio_duration_secs || 0
    );

    // Step 3: Generate improvement suggestions
    const improvementSuggestions = engine.generateImprovementSuggestions(analysis);

    // Step 4: Save to storage (Google Sheets)
    const pitchData = {
      user_name: "",
      password: "",
      transcribed_pitch: transcript,
      editted_pitch: "",
      analysis_score: analysis.overall_score,
      improvement_suggestion_text: analysis.summary_feedback,
      clarity_score: analysis.clarity,
      persuasiveness_score: analysis.persuasiveness,
      confidence_score: analysis.confidence,
      narrative_flow_score: analysis.narrative_flow,
    };

    const storageResult = await storage.savePitch(pitchData);
    console.log("Storage result:", storageResult);

    return res.json({
      transcript,
      ...analysis,
      improvementSuggestions,
      storageResult,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze speech"
    });
  }
});

app.post("/generate-pitch-audio", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/pqHfZKP75CvOlQylNhV4", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: transcript,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", errorText);
      return res.status(500).json({ error: "Failed to generate pitch audio" });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return res.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return res.status(500).json({ error: "Failed to generate pitch audio" });
  }
});

app.post("/improve-pitch", async (req, res) => {
  try {
    const { transcript, analysis } = req.body;

    if (!transcript || !analysis) {
      return res.status(400).json({ error: "Transcript and analysis are required" });
    }

    console.log("IMPROVE PITCH ROUTE HIT");

    const improvedPitch = await engine.generateImprovedPitch(transcript, analysis);

    return res.json({
      improvedPitch
    });
  } catch (error) {
    console.error("Improve pitch error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate improved pitch"
    });
  }
});

app.post("/save-improved-pitch", async (req, res) => {
  try {
    const { pitchId, improvedPitch } = req.body;

    if (!pitchId || !improvedPitch) {
      return res.status(400).json({ error: "pitchId and improvedPitch are required" });
    }

    console.log("SAVE IMPROVED PITCH ROUTE HIT");

    const result = await storage.updateEditedPitch(pitchId, improvedPitch);

    return res.json({
      success: result.success,
      message: result.success ? "Improved pitch saved" : result.error
    });
  } catch (error) {
    console.error("Save improved pitch error:", error);
    return res.status(500).json({
      error: error.message || "Failed to save improved pitch"
    });
  }
});

// Server Start
app.listen(3000, () => {
  console.log("AI SERVER running on http://localhost:3000");
});