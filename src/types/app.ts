// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Unternehmensverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    unternehmen_name?: string;
    unternehmen_strasse?: string;
    unternehmen_hausnummer?: string;
    unternehmen_plz?: string;
    unternehmen_ort?: string;
    unternehmen_notiz?: string;
  };
}

export interface Schichtartenverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    schichtart_name?: string;
    schichtart_beschreibung?: string;
    schichtart_beginn?: string;
    schichtart_ende?: string;
  };
}

export interface Schichteinteilung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zuweisung_notiz?: string;
    zuweisung_beginn?: string;
    zuweisung_ende?: string;
    zuweisung_mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiterverwaltung' Record
    zuweisung_datum?: string; // Format: YYYY-MM-DD oder ISO String
    zuweisung_unternehmen?: string; // applookup -> URL zu 'Unternehmensverwaltung' Record
    zuweisung_schichtart?: string; // applookup -> URL zu 'Schichtartenverwaltung' Record
  };
}

export interface Mitarbeiterverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    mitarbeiter_vorname?: string;
    mitarbeiter_email?: string;
    mitarbeiter_telefon?: string;
    mitarbeiter_nachname?: string;
  };
}

export const APP_IDS = {
  UNTERNEHMENSVERWALTUNG: '68b04d9e0d0c4ed362914845',
  SCHICHTARTENVERWALTUNG: '682651bf710e2817fd194864',
  SCHICHTEINTEILUNG: '682651bf7002b5008a5598bf',
  MITARBEITERVERWALTUNG: '682651b67f1fb97703cf487a',
} as const;

// Helper Types for creating new records
export type CreateUnternehmensverwaltung = Unternehmensverwaltung['fields'];
export type CreateSchichtartenverwaltung = Schichtartenverwaltung['fields'];
export type CreateSchichteinteilung = Schichteinteilung['fields'];
export type CreateMitarbeiterverwaltung = Mitarbeiterverwaltung['fields'];