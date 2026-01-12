import { useState, useEffect, useMemo } from 'react';
import type {
  Schichteinteilung,
  Mitarbeiterverwaltung,
  Schichtartenverwaltung,
  Unternehmensverwaltung
} from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isToday, isFuture, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users,
  Layers,
  Calendar,
  Plus,
  Clock,
  AlertCircle,
  Building2
} from 'lucide-react';

// Types for enriched data
interface EnrichedSchicht extends Schichteinteilung {
  mitarbeiterName: string;
  schichtartName: string;
  unternehmenName: string;
}

interface WeekChartData {
  day: string;
  fullDay: string;
  count: number;
}

// Form data type
interface NewSchichtFormData {
  datum: string;
  mitarbeiter: string;
  unternehmen: string;
  schichtart: string;
  beginn: string;
  ende: string;
  notiz: string;
}

export default function Dashboard() {
  // Data states
  const [schichten, setSchichten] = useState<Schichteinteilung[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiterverwaltung[]>([]);
  const [schichtarten, setSchichtarten] = useState<Schichtartenverwaltung[]>([]);
  const [unternehmen, setUnternehmen] = useState<Unternehmensverwaltung[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NewSchichtFormData>({
    datum: format(new Date(), 'yyyy-MM-dd'),
    mitarbeiter: '',
    unternehmen: '',
    schichtart: '',
    beginn: '06:00',
    ende: '14:00',
    notiz: ''
  });

  // Fetch all data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [s, m, sa, u] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getUnternehmensverwaltung()
        ]);
        setSchichten(s);
        setMitarbeiter(m);
        setSchichtarten(sa);
        setUnternehmen(u);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Create lookup maps
  const mitarbeiterMap = useMemo(() => {
    const map = new Map<string, Mitarbeiterverwaltung>();
    mitarbeiter.forEach(m => map.set(m.record_id, m));
    return map;
  }, [mitarbeiter]);

  const schichtartMap = useMemo(() => {
    const map = new Map<string, Schichtartenverwaltung>();
    schichtarten.forEach(s => map.set(s.record_id, s));
    return map;
  }, [schichtarten]);

  const unternehmenMap = useMemo(() => {
    const map = new Map<string, Unternehmensverwaltung>();
    unternehmen.forEach(u => map.set(u.record_id, u));
    return map;
  }, [unternehmen]);

  // Enrich shifts with related data
  const enrichedSchichten = useMemo((): EnrichedSchicht[] => {
    return schichten.map(s => {
      const mitarbeiterId = extractRecordId(s.fields.zuweisung_mitarbeiter);
      const schichtartId = extractRecordId(s.fields.zuweisung_schichtart);
      const unternehmenId = extractRecordId(s.fields.zuweisung_unternehmen);

      const ma = mitarbeiterId ? mitarbeiterMap.get(mitarbeiterId) : null;
      const sa = schichtartId ? schichtartMap.get(schichtartId) : null;
      const un = unternehmenId ? unternehmenMap.get(unternehmenId) : null;

      return {
        ...s,
        mitarbeiterName: ma ? `${ma.fields.mitarbeiter_vorname || ''} ${ma.fields.mitarbeiter_nachname || ''}`.trim() : 'Unbekannt',
        schichtartName: sa?.fields.schichtart_name || 'Unbekannt',
        unternehmenName: un?.fields.unternehmen_name || 'Unbekannt'
      };
    });
  }, [schichten, mitarbeiterMap, schichtartMap, unternehmenMap]);

  // Today's shifts
  const todayShifts = useMemo(() => {
    const today = new Date();
    return enrichedSchichten
      .filter(s => {
        if (!s.fields.zuweisung_datum) return false;
        const shiftDate = parseISO(s.fields.zuweisung_datum);
        return isToday(shiftDate);
      })
      .sort((a, b) => {
        const timeA = a.fields.zuweisung_beginn || '00:00';
        const timeB = b.fields.zuweisung_beginn || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [enrichedSchichten]);

  // Upcoming shifts (next 7 days, not today)
  const upcomingShifts = useMemo(() => {
    const today = new Date();
    return enrichedSchichten
      .filter(s => {
        if (!s.fields.zuweisung_datum) return false;
        const shiftDate = parseISO(s.fields.zuweisung_datum);
        return isFuture(shiftDate) && !isToday(shiftDate);
      })
      .sort((a, b) => {
        const dateA = a.fields.zuweisung_datum || '';
        const dateB = b.fields.zuweisung_datum || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.fields.zuweisung_beginn || '00:00';
        const timeB = b.fields.zuweisung_beginn || '00:00';
        return timeA.localeCompare(timeB);
      })
      .slice(0, 10);
  }, [enrichedSchichten]);

  // Week chart data
  const weekChartData = useMemo((): WeekChartData[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days: WeekChartData[] = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const count = enrichedSchichten.filter(s => {
        if (!s.fields.zuweisung_datum) return false;
        return isSameDay(parseISO(s.fields.zuweisung_datum), day);
      }).length;

      days.push({
        day: format(day, 'EEE', { locale: de }),
        fullDay: format(day, 'EEEE', { locale: de }),
        count
      });
    }

    return days;
  }, [enrichedSchichten]);

  // This week's shifts count
  const thisWeekCount = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return enrichedSchichten.filter(s => {
      if (!s.fields.zuweisung_datum) return false;
      const date = parseISO(s.fields.zuweisung_datum);
      return date >= weekStart && date <= weekEnd;
    }).length;
  }, [enrichedSchichten]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.mitarbeiter || !formData.datum) return;

    setSubmitting(true);
    try {
      await LivingAppsService.createSchichteinteilungEntry({
        zuweisung_datum: formData.datum,
        zuweisung_mitarbeiter: formData.mitarbeiter ? createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, formData.mitarbeiter) : undefined,
        zuweisung_unternehmen: formData.unternehmen ? createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, formData.unternehmen) : undefined,
        zuweisung_schichtart: formData.schichtart ? createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, formData.schichtart) : undefined,
        zuweisung_beginn: formData.beginn,
        zuweisung_ende: formData.ende,
        zuweisung_notiz: formData.notiz || undefined
      });

      // Refresh data
      const newSchichten = await LivingAppsService.getSchichteinteilung();
      setSchichten(newSchichten);

      // Reset form and close dialog
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        mitarbeiter: '',
        unternehmen: '',
        schichtart: '',
        beginn: '06:00',
        ende: '14:00',
        notiz: ''
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Fehler beim Erstellen der Schicht:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error.message}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-fit"
              >
                Erneut versuchen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Schichtplaner</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </header>

          {/* Desktop: Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Main column */}
            <div className="space-y-6">
              {/* Hero: Today's shifts */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold">Heute</h2>
                  <Badge variant="secondary" className="text-sm">
                    {todayShifts.length}
                  </Badge>
                </div>

                {todayShifts.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Keine Schichten heute</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setDialogOpen(true)}
                      >
                        Schicht hinzufügen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayShifts.map((shift) => (
                      <ShiftCard key={shift.record_id} shift={shift} />
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming shifts */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Kommende Schichten</h2>
                {upcomingShifts.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-6 text-center">
                      <p className="text-muted-foreground text-sm">
                        Keine anstehenden Schichten
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {upcomingShifts.map((shift) => (
                      <UpcomingShiftRow key={shift.record_id} shift={shift} />
                    ))}
                  </div>
                )}
              </section>

              {/* Weekly chart - Desktop only */}
              <section className="hidden md:block">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      Schichten diese Woche
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekChartData}>
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            stroke="hsl(215 15% 50%)"
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="hsl(215 15% 50%)"
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const data = payload[0].payload as WeekChartData;
                              return (
                                <div className="bg-card border border-border rounded-md p-2 shadow-sm">
                                  <p className="text-sm font-medium">{data.fullDay}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.count} Schicht{data.count !== 1 ? 'en' : ''}
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill="hsl(215 60% 42%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block space-y-4">
              {/* Primary action - Desktop */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12 text-base shadow-sm">
                    <Plus className="mr-2 h-5 w-5" />
                    Neue Schicht eintragen
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Neue Schicht eintragen</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="datum">Datum</Label>
                      <Input
                        id="datum"
                        type="date"
                        value={formData.datum}
                        onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mitarbeiter">Mitarbeiter</Label>
                      <Select
                        value={formData.mitarbeiter}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mitarbeiter: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mitarbeiter auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mitarbeiter.map((m) => (
                            <SelectItem key={m.record_id} value={m.record_id}>
                              {m.fields.mitarbeiter_vorname} {m.fields.mitarbeiter_nachname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unternehmen">Unternehmen</Label>
                      <Select
                        value={formData.unternehmen}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, unternehmen: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unternehmen auswählen..." />
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

                    <div className="space-y-2">
                      <Label htmlFor="schichtart">Schichtart</Label>
                      <Select
                        value={formData.schichtart}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, schichtart: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Schichtart auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {schichtarten.map((s) => (
                            <SelectItem key={s.record_id} value={s.record_id}>
                              {s.fields.schichtart_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="beginn">Beginn</Label>
                        <Input
                          id="beginn"
                          type="time"
                          value={formData.beginn}
                          onChange={(e) => setFormData(prev => ({ ...prev, beginn: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ende">Ende</Label>
                        <Input
                          id="ende"
                          type="time"
                          value={formData.ende}
                          onChange={(e) => setFormData(prev => ({ ...prev, ende: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notiz">Notiz (optional)</Label>
                      <Textarea
                        id="notiz"
                        value={formData.notiz}
                        onChange={(e) => setFormData(prev => ({ ...prev, notiz: e.target.value }))}
                        placeholder="Zusätzliche Hinweise..."
                        rows={2}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting || !formData.mitarbeiter}>
                      {submitting ? 'Wird gespeichert...' : 'Schicht speichern'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Stats cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mitarbeiter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{mitarbeiter.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Schichtarten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{schichtarten.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Diese Woche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{thisWeekCount}</p>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Mobile: Stats as horizontal scroll */}
          <section className="lg:hidden mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Schnellübersicht
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              <MiniStatCard
                icon={Users}
                value={mitarbeiter.length}
                label="Mitarbeiter"
              />
              <MiniStatCard
                icon={Layers}
                value={schichtarten.length}
                label="Schichtarten"
              />
              <MiniStatCard
                icon={Calendar}
                value={thisWeekCount}
                label="Diese Woche"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Mobile: Fixed bottom button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-5 bg-background border-t border-border">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-13 text-base shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Neue Schicht eintragen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Schicht eintragen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="datum-mobile">Datum</Label>
                <Input
                  id="datum-mobile"
                  type="date"
                  value={formData.datum}
                  onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mitarbeiter-mobile">Mitarbeiter</Label>
                <Select
                  value={formData.mitarbeiter}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, mitarbeiter: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mitarbeiter.map((m) => (
                      <SelectItem key={m.record_id} value={m.record_id}>
                        {m.fields.mitarbeiter_vorname} {m.fields.mitarbeiter_nachname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unternehmen-mobile">Unternehmen</Label>
                <Select
                  value={formData.unternehmen}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, unternehmen: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unternehmen auswählen..." />
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

              <div className="space-y-2">
                <Label htmlFor="schichtart-mobile">Schichtart</Label>
                <Select
                  value={formData.schichtart}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, schichtart: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Schichtart auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schichtarten.map((s) => (
                      <SelectItem key={s.record_id} value={s.record_id}>
                        {s.fields.schichtart_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beginn-mobile">Beginn</Label>
                  <Input
                    id="beginn-mobile"
                    type="time"
                    value={formData.beginn}
                    onChange={(e) => setFormData(prev => ({ ...prev, beginn: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ende-mobile">Ende</Label>
                  <Input
                    id="ende-mobile"
                    type="time"
                    value={formData.ende}
                    onChange={(e) => setFormData(prev => ({ ...prev, ende: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notiz-mobile">Notiz (optional)</Label>
                <Textarea
                  id="notiz-mobile"
                  value={formData.notiz}
                  onChange={(e) => setFormData(prev => ({ ...prev, notiz: e.target.value }))}
                  placeholder="Zusätzliche Hinweise..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || !formData.mitarbeiter}>
                {submitting ? 'Wird gespeichert...' : 'Schicht speichern'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Shift card for today's shifts
function ShiftCard({ shift }: { shift: EnrichedSchicht }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-foreground">{shift.mitarbeiterName}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {shift.fields.zuweisung_beginn || '—'} - {shift.fields.zuweisung_ende || '—'}
              </span>
            </div>
          </div>
          {shift.schichtartName !== 'Unbekannt' && (
            <Badge variant="secondary" className="text-xs">
              {shift.schichtartName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Building2 className="h-3 w-3" />
          <span>{shift.unternehmenName}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Row for upcoming shifts
function UpcomingShiftRow({ shift }: { shift: EnrichedSchicht }) {
  const dateStr = shift.fields.zuweisung_datum
    ? format(parseISO(shift.fields.zuweisung_datum), 'EEE, d. MMM', { locale: de })
    : '—';

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-muted-foreground w-24 shrink-0">
            {dateStr}
          </div>
          <div>
            <p className="font-medium text-sm">{shift.mitarbeiterName}</p>
            <p className="text-xs text-muted-foreground">
              {shift.fields.zuweisung_beginn || '—'} - {shift.fields.zuweisung_ende || '—'} · {shift.unternehmenName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mini stat card for mobile horizontal scroll
function MiniStatCard({
  icon: Icon,
  value,
  label
}: {
  icon: React.ElementType;
  value: number;
  label: string
}) {
  return (
    <Card className="shrink-0 w-32">
      <CardContent className="p-3">
        <Icon className="h-4 w-4 text-muted-foreground mb-1" />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
