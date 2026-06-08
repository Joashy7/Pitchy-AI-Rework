import { google } from 'googleapis';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
let authClient = null;
let sheetsApi = null;

export const initializeAuth = async () => {
  if (authClient) return authClient;

  try {
    const serviceAccountPath = join(__dirname, 'service_account.json');
    const keyFile = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    authClient = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsApi = google.sheets({
      version: 'v4',
      auth: authClient,
    });

    console.log('Google Sheets API initialized with service account');
    return authClient;
  } catch (error) {
    console.error('Failed to initialize Google Sheets auth:', error.message);
    throw error;
  }
};

const getSheetsApi = async () => {
  if (!sheetsApi) {
    await initializeAuth();
  }

  return sheetsApi;
};

const getSpreadsheetId = () => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set');
  }
  return spreadsheetId;
};

const appendToSheet = async (spreadsheetId, range, values) => {
  try {
    const api = await getSheetsApi();
    const response = await api.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });

    console.log(`Appended row to ${range}`);
    return response.data;
  } catch (error) {
    console.error('Error appending to Google Sheets:', error.message);
    throw error;
  }
};

const updateSheet = async (spreadsheetId, range, values) => {
  try {
    const api = await getSheetsApi();
    const response = await api.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });

    console.log(`Updated row at ${range}`);
    return response.data;
  } catch (error) {
    console.error('Error updating Google Sheets:', error.message);
    throw error;
  }
};

const getSheetValues = async (spreadsheetId, range) => {
  try {
    const api = await getSheetsApi();
    const response = await api.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from Google Sheets:', error.message);
    throw error;
  }
};

const findRowByValue = async (spreadsheetId, column, value) => {
  try {
    const api = await getSheetsApi();
    const response = await api.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${column}:${column}`,
    });

    const values = response.data.values || [];
    for (let i = 0; i < values.length; i += 1) {
      if (values[i][0] === value) {
        return i + 1;
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding row:', error.message);
    return null;
  }
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const truncateText = (text, maxLength = 80) => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown date';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeDuration = (duration) => {
  const normalized = String(duration || '').trim();
  return normalized || 'N/A';
};

const durationToSeconds = (duration) => {
  const normalized = String(duration || '').trim();
  if (!normalized || normalized === 'N/A') return 0;

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    return Math.round(Number(normalized));
  }

  const parts = normalized.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
};

const getStatusFromScore = (score) => {
  if (score >= 90) return 'ELITE';
  if (score >= 70) return 'IMPROVING';
  return 'ACTION NEEDED';
};

const getPitchName = (pitchId, timestamp, transcript) => {
  const transcriptPreview = truncateText(transcript, 42);
  if (transcriptPreview) return transcriptPreview;

  if (timestamp) {
    return `Pitch from ${formatDate(timestamp)}`;
  }

  return pitchId ? `Pitch ${pitchId.replace('PITCH_', '')}` : 'Recorded Pitch';
};

const isPitchRow = (row, index) => {
  const pitchId = String(row[2] || '').trim();
  const transcript = String(row[4] || '').trim();

  if (index === 0 && /pitch/i.test(pitchId) && !pitchId.startsWith('PITCH_')) {
    return false;
  }

  return Boolean(pitchId || transcript);
};

const mapPitchRowForDashboard = (row, index) => {
  const pitchId = String(row[2] || `ROW_${index + 1}`).trim();
  const timestamp = String(row[3] || '').trim();
  const transcript = String(row[4] || '').trim();
  const improvedPitch = String(row[5] || '').trim();
  const score = toNumber(row[6]);
  const summary = String(row[7] || '').trim();
  const duration = normalizeDuration(row[12]);

  return {
    id: pitchId,
    pitchId,
    name: getPitchName(pitchId, timestamp, transcript),
    description: truncateText(summary || transcript || improvedPitch || 'No summary available.'),
    date: formatDate(timestamp),
    timestamp,
    persona: 'AI Pitch Coach',
    duration,
    score,
    status: getStatusFromScore(score),
    transcript,
    improvedPitch,
    summary_feedback: summary,
    clarity: toNumber(row[8]),
    persuasiveness: toNumber(row[9]),
    confidence: toNumber(row[10]),
    narrative_flow: toNumber(row[11]),
    overall_score: score,
  };
};

const buildDashboardStats = (pitches) => {
  const totalPitches = pitches.length;
  const totalScore = pitches.reduce((sum, pitch) => sum + pitch.score, 0);
  const avgScore = totalPitches ? Math.round(totalScore / totalPitches) : 0;
  const totalSeconds = pitches.reduce(
    (sum, pitch) => sum + durationToSeconds(pitch.duration),
    0
  );
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = pitches.filter((pitch) => {
    const timestamp = Date.parse(pitch.timestamp);
    return Number.isFinite(timestamp) && timestamp >= oneWeekAgo;
  }).length;
  const chronologicalPitches = [...pitches].sort(
    (a, b) => Date.parse(a.timestamp || 0) - Date.parse(b.timestamp || 0)
  );
  const firstScore = chronologicalPitches[0]?.score || 0;
  const latestScore = chronologicalPitches[chronologicalPitches.length - 1]?.score || 0;
  const scoreChange = totalPitches > 1 ? latestScore - firstScore : 0;

  return {
    totalPitches,
    avgScore,
    totalRecordingTime: (totalSeconds / 3600).toFixed(1),
    newThisWeek,
    scoreBadge: avgScore >= 90 ? 'Top 5%' : avgScore >= 75 ? 'Strong' : 'Building',
    improvementRate: `${scoreChange >= 0 ? '+' : ''}${scoreChange}%`,
    improvementLabel: scoreChange > 0 ? 'Improving' : scoreChange < 0 ? 'Needs Focus' : 'Steady',
  };
};

export const savePitch = async (pitchData) => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();
    const {
      transcribed_pitch = '',
      analysis_score = 0,
      improvement_suggestion_text = '',
      clarity_score = 0,
      persuasiveness_score = 0,
      confidence_score = 0,
      narrative_flow_score = 0,
      duration = '',
    } = pitchData;
    const improvedPitch =
      pitchData.improved_pitch ??
      pitchData.improvedPitch ??
      '';
    const timestamp = new Date().toISOString();
    const pitchId = `PITCH_${Date.now()}`;
    const row = [
      '',
      '',
      pitchId,
      timestamp,
      transcribed_pitch,
      improvedPitch,
      analysis_score,
      improvement_suggestion_text,
      clarity_score,
      persuasiveness_score,
      confidence_score,
      narrative_flow_score,
      duration,
    ];
    const result = await appendToSheet(spreadsheetId, 'Sheet1!A:M', row);

    return {
      success: true,
      pitchId,
      timestamp,
      result,
    };
  } catch (error) {
    console.error('Error saving pitch:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getDashboardData = async () => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();
    const rows = await getSheetValues(spreadsheetId, 'Sheet1!A:M');
    const pitches = rows
      .filter(isPitchRow)
      .map(mapPitchRowForDashboard)
      .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0));

    return {
      success: true,
      pitches,
      stats: buildDashboardStats(pitches),
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error.message);
    return {
      success: false,
      error: error.message,
      pitches: [],
      stats: buildDashboardStats([]),
    };
  }
};

export const saveImprovedPitch = async (pitchId, improvedPitch) => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();
    const rowIndex = await findRowByValue(spreadsheetId, 'C', pitchId);

    if (!rowIndex) {
      return {
        success: false,
        error: `Pitch with ID ${pitchId} not found`,
      };
    }

    const result = await updateSheet(spreadsheetId, `Sheet1!F${rowIndex}`, [improvedPitch]);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('Error saving improved pitch:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
