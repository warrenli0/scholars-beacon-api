// sheets.ts
// @ts-nocheck
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const authenticate = async (): Promise<any> => {
  const auth = new GoogleAuth({
    keyFile: 'google-sheets/credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  return client;
};

export const getSheetData = async (spreadsheetId: string, range: string): Promise<string[][]> => {
  const auth = await authenticate();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values as string[][];
};
