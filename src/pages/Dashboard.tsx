import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, isSameDay, isWithinInterval, parseISO, startOfWeek, endOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

import {
  LivingAppsService,
  extractRecordId,
  createRecordUrl,
} from '@/services/livingAppsService';
import type {
  Schichteinteilung,
  Mitarbeiterverwaltung,
  Schichtartenverwaltung,
  Unternehmensverwaltung,
} from '@/types/app';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helpers
const today = new Date();

function formatDate(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function Dashboard() {
  // State
  const [schichten, setSchichten] = useState<Schichteinteilung[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiterverwaltung[]>([]);
  const [schichtarten, setSchichtarten] = useState<Schichtartenverwaltung[]>([]);
  const [unternehmen, setUnternehmen] = useState<Unternehmensverwaltung[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, m, sa, u] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getUnternehmensverwaltung(),
      ]);
      setSchichten(s);
      setMitarbeiter(m);
      setSchichtarten(sa);
      setUnternehmen(u);
    } catch (e: any) {
      setError(e.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Derived Data ---
  const schichtenHeute = useMemo(() => {
    return schichten.filter((s) => isSameDay(parseISO(s.fields.zuweisung_datum || ''), today));
  }, [schichten]);

  const schichtenWoche = useMemo(() => {
    const start = startOfWeek(today, { locale: de, weekStartsOn: 1 });
    const end = endOfWeek(today, { locale: de, weekStartsOn: 1 });
    return schichten.filter((s) => {
      const datum = s.fields.zuweisung_datum ? parseISO(s.fields.zuweisung_datum) : null;
      return datum && isWithinInterval(datum, { start, end });
    });
  }, [schichten]);

  const mitarbeiterHeute = useMemo(() => {
    const ids = new Set<string>();
    schichtenHeute.forEach((s) => {
      const id = extractRecordId(s.fields.zuweisung_mitarbeiter || '');
      if (id) ids.add(id);
    });
    return ids.size;
  }, [schichtenHeute]);

  const offeneSchichten = useMemo(() => {
    const upcoming7 = addDays(today, 7);
    return schichten.filter((s) => {
      const datum = s.fields.zuweisung_datum ? parseISO(s.fields.zuweisung_datum) : null;
      const within7 = datum && isWithinInterval(datum, { start: today, end: upcoming7 });
      const zugewiesen = !!s.fields.zuweisung_mitarbeiter;
      return within7 && !zugewiesen;
    }).length;
  }, [schichten]);

  const wocheCount = schichtenWoche.length;
  const heuteCount = schichtenHeute.length;
  const progress = wocheCount ? (heuteCount / wocheCount) * 100 : 0;

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: today, end: addDays(today, 6) });
    return days.map((day) => {
      const dateStr = formatDate(day);
      const count = schichten.filter((s) => s.fields.zuweisung_datum === dateStr).length;
      return { date: format(day, 'dd.MM', { locale: de }), count };
    });
  }, [schichten]);

  const listData = useMemo(() => {
    return [...schichten]
      .sort((a, b) => {
        const da = parseISO(a.fields.zuweisung_datum || '');
        const db = parseISO(b.fields.zuweisung_datum || '');
        return da.getTime() - db.getTime();
      })
      .slice(0, 5);
  }, [schichten]);

  // --- Helpers for lookup names ---
  const mitarbeiterMap = useMemo(() => {
    const map = new Map<string, string>();
    mitarbeiter.forEach((m) => {
      map.set(m.record_id, `${m.fields.mitarbeiter_vorname || ''} ${m.fields.mitarbeiter_nachname || ''}`.trim());
    });
    return map;
  }, [mitarbeiter]);

  const schichtartMap = useMemo(() => {
    const map = new Map<string, string>();
    schichtarten.forEach((s) => map.set(s.record_id, s.fields.schichtart_name || ''));
    return map;
  }, [schichtarten]);

  const unternehmenMap = useMemo(() => {
    const map = new Map<string, string>();
    unternehmen.forEach((u) => map.set(u.record_id, u.fields.unternehmen_name || ''));
    return map;
  }, [unternehmen]);

  // --- Add Shift Dialog State ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<Schichteinteilung['fields']>>({
    zuweisung_datum: formatDate(today),
  });
  const [saving, setSaving] = useState(false);

  const handleFormChange = (field: keyof Schichteinteilung['fields'], value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await LivingAppsService.createSchichteinteilungEntry(formState as Schichteinteilung['fields']);
      setDialogOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Lade...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schichtplan</h1>

        {/* Desktop Primary Action */}
        {!isMobile && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Schicht hinzufügen</Button>
            </DialogTrigger>
            <AddShiftDialogContent
              formState={formState}
              onChange={handleFormChange}
              onSave={handleSave}
              saving={saving}
              mitarbeiter={mitarbeiter}
              schichtarten={schichtarten}
              unternehmen={unternehmen}
            />
          </Dialog>
        )}
      </div>

      {/* Layout */}
      <div className={isMobile ? 'flex flex-col gap-6' : 'grid grid-cols-12 gap-6'}>
        {/* Hero KPI */}
        <Card
          className={isMobile ? '' : 'col-span-7 flex items-center justify-center'}
        >
          <CardHeader className="items-center text-center">
            <CardTitle>Schichten heute</CardTitle>
            <CardDescription>heute geplant</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ProgressRing value={progress} size={isMobile ? 180 : 220}>
              <span className="text-5xl font-bold">{heuteCount}</span>
            </ProgressRing>
          </CardContent>
        </Card>

        {/* Secondary KPIs */}
        <div className={isMobile ? '-mx-4 overflow-x-auto px-4' : 'col-span-5 flex flex-col gap-4'}>
          <div className={isMobile ? 'flex gap-4 w-max' : 'flex flex-col gap-4'}>
            <KpiCard label="Mitarbeiter heute" value={mitarbeiterHeute} />
            <KpiCard label="Offene Schichten" value={offeneSchichten} accent />
            <KpiCard label="Schichten Woche" value={wocheCount} />
          </div>
        </div>

        {/* Chart */}
        <div className={isMobile ? '' : 'col-span-7'}>
          <Card>
            <CardHeader>
              <CardTitle>Schichten – nächste 7 Tage</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className={isMobile ? '' : 'col-span-7'}>
          <Card>
            <CardHeader>
              <CardTitle>Nächste Schichten</CardTitle>
            </CardHeader>
            <CardContent>
              {listData.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">Keine Daten</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">Datum</th>
                      <th className="py-2">Zeit</th>
                      <th className="py-2">Mitarbeiter</th>
                      <th className="py-2">Schichtart</th>
                      <th className="py-2">Unternehmen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.map((s) => {
                      const mId = extractRecordId(s.fields.zuweisung_mitarbeiter || '') || '';
                      const mitarbeiterName = mitarbeiterMap.get(mId) || '—';
                      const saId = extractRecordId(s.fields.zuweisung_schichtart || '') || '';
                      const schichtName = schichtartMap.get(saId) || '—';
                      const uId = extractRecordId(s.fields.zuweisung_unternehmen || '') || '';
                      const unternehmenName = unternehmenMap.get(uId) || '—';

                      return (
                        <tr key={s.record_id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => window.open(createRecordUrl('682651bf7002b5008a5598bf', s.record_id), '_blank') }>
                          <td className="py-2">{s.fields.zuweisung_datum}</td>
                          <td className="py-2">{`${s.fields.zuweisung_beginn || '—'} – ${s.fields.zuweisung_ende || '—'}`}</td>
                          <td className="py-2">{mitarbeiterName}</td>
                          <td className="py-2">{schichtName}</td>
                          <td className="py-2">{unternehmenName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 size-14 rounded-full p-0 text-3xl shadow-lg" size="icon-lg">
              +
            </Button>
          </DialogTrigger>
          <AddShiftDialogContent
            formState={formState}
            onChange={handleFormChange}
            onSave={handleSave}
            saving={saving}
            mitarbeiter={mitarbeiter}
            schichtarten={schichtarten}
            unternehmen={unternehmen}
          />
        </Dialog>
      )}
    </div>
  );
}

// --- KPI Card ---
function KpiCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-accent' : ''}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

// --- Progress Ring component ---
function ProgressRing({ value, size = 200, children }: { value: number; size?: number; children: React.ReactNode }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
      <circle
        stroke="var(--muted)"
        fill="transparent"
        strokeWidth={stroke}
        cx={size / 2}
        cy={size / 2}
        r={radius}
      />
      <circle
        stroke="var(--primary)"
        fill="transparent"
        strokeLinecap="round"
        strokeWidth={stroke}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      <foreignObject x="0" y="0" width={size} height={size} className="flex items-center justify-center">
        <div className="flex w-full h-full items-center justify-center">{children}</div>
      </foreignObject>
    </svg>
  );
}

// --- Add Shift Dialog Content ---
function AddShiftDialogContent({
  formState,
  onChange,
  onSave,
  saving,
  mitarbeiter,
  schichtarten,
  unternehmen,
}: {
  formState: Partial<Schichteinteilung['fields']>;
  onChange: (field: keyof Schichteinteilung['fields'], value: string) => void;
  onSave: () => void;
  saving: boolean;
  mitarbeiter: Mitarbeiterverwaltung[];
  schichtarten: Schichtartenverwaltung[];
  unternehmen: Unternehmensverwaltung[];
}) {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Schicht hinzufügen</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="datum" className="text-right">
            Datum
          </Label>
          <Input
            id="datum"
            type="date"
            className="col-span-3"
            value={formState.zuweisung_datum || ''}
            onChange={(e) => onChange('zuweisung_datum', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="schichtart" className="text-right">
            Schichtart
          </Label>
          <Select
            value={extractRecordId(formState.zuweisung_schichtart || '') || ''}
            onValueChange={(val) => onChange('zuweisung_schichtart', createRecordUrl('682651bf710e2817fd194864', val))}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {schichtarten.map((sa) => (
                <SelectItem key={sa.record_id} value={sa.record_id}>
                  {sa.fields.schichtart_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mitarbeiter" className="text-right">
            Mitarbeiter
          </Label>
          <Select
            value={extractRecordId(formState.zuweisung_mitarbeiter || '') || ''}
            onValueChange={(val) =>
              onChange('zuweisung_mitarbeiter', createRecordUrl('682651b67f1fb97703cf487a', val))
            }
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {mitarbeiter.map((m) => (
                <SelectItem key={m.record_id} value={m.record_id}>
                  {`${m.fields.mitarbeiter_vorname || ''} ${m.fields.mitarbeiter_nachname || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="unternehmen" className="text-right">
            Unternehmen
          </Label>
          <Select
            value={extractRecordId(formState.zuweisung_unternehmen || '') || ''}
            onValueChange={(val) =>
              onChange('zuweisung_unternehmen', createRecordUrl('68b04d9e0d0c4ed362914845', val))
            }
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {unternehmen.map((u) => (
                <SelectItem key={u.record_id} value={u.record_id}>
                  {u.fields.unternehmen_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="beginn" className="text-right">
            Beginn
          </Label>
          <Input
            id="beginn"
            type="text"
            placeholder="HH:MM"
            className="col-span-3"
            value={formState.zuweisung_beginn || ''}
            onChange={(e) => onChange('zuweisung_beginn', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="ende" className="text-right">
            Ende
          </Label>
          <Input
            id="ende"
            type="text"
            placeholder="HH:MM"
            className="col-span-3"
            value={formState.zuweisung_ende || ''}
            onChange={(e) => onChange('zuweisung_ende', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="notiz" className="text-right">
            Notiz
          </Label>
          <Textarea
            id="notiz"
            className="col-span-3"
            value={formState.zuweisung_notiz || ''}
            onChange={(e) => onChange('zuweisung_notiz', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onSave()} disabled={saving}>
          Speichern
        </Button>
      </div>
    </DialogContent>
  );
}

export default Dashboard;
