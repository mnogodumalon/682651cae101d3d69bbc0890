import type { EnrichedSchichteinteilung } from '@/types/enriched';
import type { Mitarbeiterverwaltung, Schichtartenverwaltung, Schichteinteilung, Unternehmensverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: string | undefined, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchichteinteilungMaps {
  mitarbeiterverwaltungMap: Map<string, Mitarbeiterverwaltung>;
  unternehmensverwaltungMap: Map<string, Unternehmensverwaltung>;
  schichtartenverwaltungMap: Map<string, Schichtartenverwaltung>;
}

export function enrichSchichteinteilung(
  schichteinteilung: Schichteinteilung[],
  maps: SchichteinteilungMaps
): EnrichedSchichteinteilung[] {
  return schichteinteilung.map(r => ({
    ...r,
    zuweisung_mitarbeiterName: resolveDisplay(r.fields.zuweisung_mitarbeiter, maps.mitarbeiterverwaltungMap, 'mitarbeiter_vorname'),
    zuweisung_unternehmenName: resolveDisplay(r.fields.zuweisung_unternehmen, maps.unternehmensverwaltungMap, 'unternehmen_name'),
    zuweisung_schichtartName: resolveDisplay(r.fields.zuweisung_schichtart, maps.schichtartenverwaltungMap, 'schichtart_name'),
  }));
}
