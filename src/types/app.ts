// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Unternehmensverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    unternehmen_name?: string;
    unternehmen_plz?: string;
    unternehmen_notiz?: string;
    unternehmen_ort?: string;
    unternehmen_strasse?: string;
    unternehmen_hausnummer?: string;
  };
}

export interface Schichteinteilung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    zuweisung_notiz?: string;
    zuweisung_ende?: string;
    zuweisung_datum?: string; // Format: YYYY-MM-DD oder ISO String
    zuweisung_unternehmen?: string; // applookup -> URL zu 'Unternehmensverwaltung' Record
    zuweisung_schichtart?: string; // applookup -> URL zu 'Schichtartenverwaltung' Record
    zuweisung_beginn?: string;
    zuweisung_mitarbeiter?: string; // applookup -> URL zu 'Mitarbeiterverwaltung' Record
  };
}

export interface Schichtartenverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    schichtart_name?: string;
    schichtart_beschreibung?: string;
    schichtart_ende?: string;
    schichtart_beginn?: string;
  };
}

export interface Mitarbeiterverwaltung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    mitarbeiter_vorname?: string;
    mitarbeiter_telefon?: string;
    mitarbeiter_nachname?: string;
    mitarbeiter_email?: string;
  };
}

export const APP_IDS = {
  UNTERNEHMENSVERWALTUNG: '68b04d9e0d0c4ed362914845',
  SCHICHTEINTEILUNG: '682651bf7002b5008a5598bf',
  SCHICHTARTENVERWALTUNG: '682651bf710e2817fd194864',
  MITARBEITERVERWALTUNG: '682651b67f1fb97703cf487a',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'unternehmensverwaltung': {
    'unternehmen_name': 'string/text',
    'unternehmen_plz': 'string/text',
    'unternehmen_notiz': 'string/textarea',
    'unternehmen_ort': 'string/text',
    'unternehmen_strasse': 'string/text',
    'unternehmen_hausnummer': 'string/text',
  },
  'schichteinteilung': {
    'zuweisung_notiz': 'string/textarea',
    'zuweisung_ende': 'string/text',
    'zuweisung_datum': 'date/date',
    'zuweisung_unternehmen': 'applookup/select',
    'zuweisung_schichtart': 'applookup/select',
    'zuweisung_beginn': 'string/text',
    'zuweisung_mitarbeiter': 'applookup/select',
  },
  'schichtartenverwaltung': {
    'schichtart_name': 'string/text',
    'schichtart_beschreibung': 'string/textarea',
    'schichtart_ende': 'string/text',
    'schichtart_beginn': 'string/text',
  },
  'mitarbeiterverwaltung': {
    'mitarbeiter_vorname': 'string/text',
    'mitarbeiter_telefon': 'string/tel',
    'mitarbeiter_nachname': 'string/text',
    'mitarbeiter_email': 'string/email',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateUnternehmensverwaltung = StripLookup<Unternehmensverwaltung['fields']>;
export type CreateSchichteinteilung = StripLookup<Schichteinteilung['fields']>;
export type CreateSchichtartenverwaltung = StripLookup<Schichtartenverwaltung['fields']>;
export type CreateMitarbeiterverwaltung = StripLookup<Mitarbeiterverwaltung['fields']>;