import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";

import * as engine from "./server/engine.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const sendEngineError = (res, error, fallbackMessage) => {
  const statusCode = engine.getErrorStatusCode(error);

  return res.status(statusCode).json({
    error: error.message || fallbackMessage,
  });
};

try {
  await engine.initializeEngine();
} catch (error) {
  console.error("Failed to initialize engine:", error.message);
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("Pitchy AI Server is running");
});

app.get("/dashboard-data", async (req, res) => {
  try {
    const dashboardData = await engine.getDashboardData();

    if (!dashboardData.success) {
      return res.status(500).json(dashboardData);
    }

    return res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard data error:", error);
    return sendEngineError(res, error, "Failed to load dashboard data");
  }
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("ANALYZE ROUTE HIT");
    return res.json(await engine.analyzePitchFile(req.file));
  } catch (error) {
    console.error("Analyze error:", error);
    return sendEngineError(res, error, "Failed to analyze speech");
  }
});

app.post("/generate-pitch-audio", async (req, res) => {
  try {
    return res.json(await engine.generatePitchAudio(req.body.transcript));
  } catch (error) {
    console.error("TTS route error:", error);
    return sendEngineError(res, error, "Failed to generate pitch audio");
  }
});

app.post("/improve-pitch", async (req, res) => {
  try {
    const { transcript, analysis } = req.body;

    console.log("IMPROVE PITCH ROUTE HIT");
    return res.json(await engine.improvePitch(transcript, analysis));
  } catch (error) {
    console.error("Improve pitch error:", error);
    return sendEngineError(res, error, "Failed to generate improved pitch");
  }
});

app.post("/save-improved-pitch", async (req, res) => {
  try {
    const { pitchId, improvedPitch } = req.body;

    console.log("SAVE IMPROVED PITCH ROUTE HIT");
    return res.json(await engine.saveImprovedPitch(pitchId, improvedPitch));
  } catch (error) {
    console.error("Save improved pitch error:", error);
    return sendEngineError(res, error, "Failed to save improved pitch");
  }
});

app.listen(3000, () => {
  console.log("AI SERVER running on http://localhost:3000");
});
