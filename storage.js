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

    console.log('✓ Google Sheets API initialized with service account');
    return authClient;
  } catch (error) {
    console.error('✗ Failed to initialize Google Sheets auth:', error.message);
    throw error;
  }
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
    if (!sheetsApi) {
      await initializeAuth();
    }

    const response = await sheetsApi.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });

    console.log(`✓ Appended row to ${range}`);
    return response.data;
  } catch (error) {
    console.error('✗ Error appending to Google Sheets:', error.message);
    throw error;
  }
};

const updateSheet = async (spreadsheetId, range, values) => {
  try {
    if (!sheetsApi) {
      await initializeAuth();
    }

    const response = await sheetsApi.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values: [values],
      },
    });

    console.log(`✓ Updated row at ${range}`);
    return response.data;
  } catch (error) {
    console.error('✗ Error updating Google Sheets:', error.message);
    throw error;
  }
};

const findRowByValue = async (spreadsheetId, column, value) => {
  try {
    if (!sheetsApi) {
      await initializeAuth();
    }

    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${column}:${column}`,
    });

    const values = response.data.values || [];
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === value) {
        return i + 1;
      }
    }
    return null;
  } catch (error) {
    console.error('✗ Error finding row:', error.message);
    return null;
  }
};

export const savePitch = async (pitchData) => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();

    const {
      user_name = '',
      password = '',
      transcribed_pitch = '',
      editted_pitch = '',
      analysis_score = 0,
      improvement_suggestion_text = '',
      clarity_score = 0,
      persuasiveness_score = 0,
      confidence_score = 0,
      narrative_flow_score = 0,
    } = pitchData;

    const timestamp = new Date().toISOString();
    const pitchId = `PITCH_${Date.now()}`;

    const row = [
      '',  // user_name (skipped for now)
      '',  // password (skipped for now)
      pitchId,
      timestamp,
      transcribed_pitch,
      editted_pitch,
      analysis_score,
      improvement_suggestion_text,
      clarity_score,
      persuasiveness_score,
      confidence_score,
      narrative_flow_score,
    ];

    const result = await appendToSheet(spreadsheetId, 'Sheet1!A:L', row);

    return {
      success: true,
      pitchId,
      timestamp,
      result,
    };
  } catch (error) {
    console.error('✗ Error saving pitch:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const saveImprovementSuggestions = async (pitchId, suggestions) => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();

    const suggestionsJson = JSON.stringify(suggestions);

    const row = [
      pitchId,
      new Date().toISOString(),
      suggestionsJson,
    ];

    const result = await appendToSheet(spreadsheetId, 'Improvements!A:C', row);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('✗ Error saving improvement suggestions:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateEditedPitch = async (pitchId, editedPitch) => {
  try {
    await initializeAuth();
    const spreadsheetId = getSpreadsheetId();

    const rowIndex = await findRowByValue(spreadsheetId, 'A', pitchId);

    if (!rowIndex) {
      return {
        success: false,
        error: `Pitch with ID ${pitchId} not found`,
      };
    }

    const row = [
      pitchId,
      new Date().toISOString(),
      editedPitch,
      'updated',
    ];

    const result = await updateSheet(spreadsheetId, `Updates!A${rowIndex}:D${rowIndex}`, row);

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('✗ Error updating edited pitch:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
