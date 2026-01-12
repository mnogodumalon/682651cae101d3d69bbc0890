// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Unternehmensverwaltung, Schichtartenverwaltung, Schichteinteilung, Mitarbeiterverwaltung } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- UNTERNEHMENSVERWALTUNG ---
  static async getUnternehmensverwaltung(): Promise<Unternehmensverwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.UNTERNEHMENSVERWALTUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getUnternehmensverwaltungEntry(id: string): Promise<Unternehmensverwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.UNTERNEHMENSVERWALTUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createUnternehmensverwaltungEntry(fields: Unternehmensverwaltung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.UNTERNEHMENSVERWALTUNG}/records`, { fields });
  }
  static async updateUnternehmensverwaltungEntry(id: string, fields: Partial<Unternehmensverwaltung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.UNTERNEHMENSVERWALTUNG}/records/${id}`, { fields });
  }
  static async deleteUnternehmensverwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.UNTERNEHMENSVERWALTUNG}/records/${id}`);
  }

  // --- SCHICHTARTENVERWALTUNG ---
  static async getSchichtartenverwaltung(): Promise<Schichtartenverwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTARTENVERWALTUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSchichtartenverwaltungEntry(id: string): Promise<Schichtartenverwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTARTENVERWALTUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSchichtartenverwaltungEntry(fields: Schichtartenverwaltung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHICHTARTENVERWALTUNG}/records`, { fields });
  }
  static async updateSchichtartenverwaltungEntry(id: string, fields: Partial<Schichtartenverwaltung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHICHTARTENVERWALTUNG}/records/${id}`, { fields });
  }
  static async deleteSchichtartenverwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHICHTARTENVERWALTUNG}/records/${id}`);
  }

  // --- SCHICHTEINTEILUNG ---
  static async getSchichteinteilung(): Promise<Schichteinteilung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTEINTEILUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getSchichteinteilungEntry(id: string): Promise<Schichteinteilung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTEINTEILUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createSchichteinteilungEntry(fields: Schichteinteilung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHICHTEINTEILUNG}/records`, { fields });
  }
  static async updateSchichteinteilungEntry(id: string, fields: Partial<Schichteinteilung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHICHTEINTEILUNG}/records/${id}`, { fields });
  }
  static async deleteSchichteinteilungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHICHTEINTEILUNG}/records/${id}`);
  }

  // --- MITARBEITERVERWALTUNG ---
  static async getMitarbeiterverwaltung(): Promise<Mitarbeiterverwaltung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITERVERWALTUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getMitarbeiterverwaltungEntry(id: string): Promise<Mitarbeiterverwaltung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITERVERWALTUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createMitarbeiterverwaltungEntry(fields: Mitarbeiterverwaltung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MITARBEITERVERWALTUNG}/records`, { fields });
  }
  static async updateMitarbeiterverwaltungEntry(id: string, fields: Partial<Mitarbeiterverwaltung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MITARBEITERVERWALTUNG}/records/${id}`, { fields });
  }
  static async deleteMitarbeiterverwaltungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MITARBEITERVERWALTUNG}/records/${id}`);
  }

}