import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Unternehmensverwaltung, Schichtartenverwaltung, Schichteinteilung, Mitarbeiterverwaltung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [unternehmensverwaltung, setUnternehmensverwaltung] = useState<Unternehmensverwaltung[]>([]);
  const [schichtartenverwaltung, setSchichtartenverwaltung] = useState<Schichtartenverwaltung[]>([]);
  const [schichteinteilung, setSchichteinteilung] = useState<Schichteinteilung[]>([]);
  const [mitarbeiterverwaltung, setMitarbeiterverwaltung] = useState<Mitarbeiterverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [unternehmensverwaltungData, schichtartenverwaltungData, schichteinteilungData, mitarbeiterverwaltungData] = await Promise.all([
        LivingAppsService.getUnternehmensverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
      ]);
      setUnternehmensverwaltung(unternehmensverwaltungData);
      setSchichtartenverwaltung(schichtartenverwaltungData);
      setSchichteinteilung(schichteinteilungData);
      setMitarbeiterverwaltung(mitarbeiterverwaltungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const unternehmensverwaltungMap = useMemo(() => {
    const m = new Map<string, Unternehmensverwaltung>();
    unternehmensverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [unternehmensverwaltung]);

  const schichtartenverwaltungMap = useMemo(() => {
    const m = new Map<string, Schichtartenverwaltung>();
    schichtartenverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schichtartenverwaltung]);

  const mitarbeiterverwaltungMap = useMemo(() => {
    const m = new Map<string, Mitarbeiterverwaltung>();
    mitarbeiterverwaltung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiterverwaltung]);

  return { unternehmensverwaltung, setUnternehmensverwaltung, schichtartenverwaltung, setSchichtartenverwaltung, schichteinteilung, setSchichteinteilung, mitarbeiterverwaltung, setMitarbeiterverwaltung, loading, error, fetchAll, unternehmensverwaltungMap, schichtartenverwaltungMap, mitarbeiterverwaltungMap };
}