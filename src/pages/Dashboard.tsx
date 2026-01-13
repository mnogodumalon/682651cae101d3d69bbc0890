import { useState, useEffect, useMemo } from 'react';
import type { Schichteinteilung, Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Calendar, Users, Layers, Clock, AlertCircle } from 'lucide-react';

// Helper to get initials from name
function getInitials(vorname?: string, nachname?: string): string {
  const first = vorname?.[0]?.toUpperCase() || '';
  const last = nachname?.[0]?.toUpperCase() || '';
  return first + last || '?';
}

// Generate a consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    'hsl(243 75% 58%)', // indigo
    'hsl(152 60% 40%)', // green
    'hsl(280 60% 55%)', // purple
    'hsl(200 75% 50%)', // blue
    'hsl(40 90% 50%)',  // amber
    'hsl(340 75% 55%)', // pink
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Dashboard() {
  // State for data
  const [schichten, setSchichten] = useState<Schichteinteilung[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiterverwaltung[]>([]);
  const [schichtarten, setSchichtarten] = useState<Schichtartenverwaltung[]>([]);
  const [unternehmen, setUnternehmen] = useState<Unternehmensverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    mitarbeiter: '',
    schichtart: '',
    unternehmen: '',
    beginn: '06:00',
    ende: '14:00',
    notiz: '',
  });

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [schichtenData, mitarbeiterData, schichtartenData, unternehmenData] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getUnternehmensverwaltung(),
        ]);
        setSchichten(schichtenData);
        setMitarbeiter(mitarbeiterData);
        setSchichtarten(schichtartenData);
        setUnternehmen(unternehmenData);
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

  // Today's date
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Filter today's shifts
  const todayShifts = useMemo(() => {
    return schichten.filter(s => s.fields.zuweisung_datum === todayStr);
  }, [schichten, todayStr]);

  // Get unique employees for today
  const todayEmployees = useMemo(() => {
    const employeeIds = new Set<string>();
    todayShifts.forEach(s => {
      const id = extractRecordId(s.fields.zuweisung_mitarbeiter);
      if (id) employeeIds.add(id);
    });
    return Array.from(employeeIds).map(id => mitarbeiterMap.get(id)).filter(Boolean) as Mitarbeiterverwaltung[];
  }, [todayShifts, mitarbeiterMap]);

  // Calculate time range for today
  const todayTimeRange = useMemo(() => {
    if (todayShifts.length === 0) return null;
    const times = todayShifts.flatMap(s => [s.fields.zuweisung_beginn, s.fields.zuweisung_ende]).filter(Boolean) as string[];
    if (times.length === 0) return null;
    const sorted = times.sort();
    return { start: sorted[0], end: sorted[sorted.length - 1] };
  }, [todayShifts]);

  // Current week shifts
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weekShifts = useMemo(() => {
    return schichten.filter(s => {
      if (!s.fields.zuweisung_datum) return false;
      const date = parseISO(s.fields.zuweisung_datum);
      return date >= weekStart && date <= weekEnd;
    });
  }, [schichten, weekStart, weekEnd]);

  // Unique employees this week
  const weekEmployeesCount = useMemo(() => {
    const ids = new Set<string>();
    weekShifts.forEach(s => {
      const id = extractRecordId(s.fields.zuweisung_mitarbeiter);
      if (id) ids.add(id);
    });
    return ids.size;
  }, [weekShifts]);

  // Unique shift types this week
  const weekSchichtartenCount = useMemo(() => {
    const ids = new Set<string>();
    weekShifts.forEach(s => {
      const id = extractRecordId(s.fields.zuweisung_schichtart);
      if (id) ids.add(id);
    });
    return ids.size;
  }, [weekShifts]);

  // Weekly chart data
  const weekChartData = useMemo(() => {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const data = days.map((name, index) => {
      const date = addDays(weekStart, index);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = schichten.filter(s => s.fields.zuweisung_datum === dateStr).length;
      return { name, count, date: dateStr, isToday: isToday(date) };
    });
    return data;
  }, [schichten, weekStart]);

  // Upcoming shifts (next 7 days)
  const upcomingShifts = useMemo(() => {
    const upcoming: Array<{
      shift: Schichteinteilung;
      employee: Mitarbeiterverwaltung | undefined;
      schichtart: Schichtartenverwaltung | undefined;
    }> = [];

    schichten.forEach(s => {
      if (!s.fields.zuweisung_datum) return;
      const shiftDate = parseISO(s.fields.zuweisung_datum);
      const endDate = addDays(today, 7);
      if (shiftDate >= today && shiftDate <= endDate) {
        const employeeId = extractRecordId(s.fields.zuweisung_mitarbeiter);
        const schichtartId = extractRecordId(s.fields.zuweisung_schichtart);
        upcoming.push({
          shift: s,
          employee: employeeId ? mitarbeiterMap.get(employeeId) : undefined,
          schichtart: schichtartId ? schichtartMap.get(schichtartId) : undefined,
        });
      }
    });

    return upcoming.sort((a, b) => {
      const dateA = a.shift.fields.zuweisung_datum || '';
      const dateB = b.shift.fields.zuweisung_datum || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.shift.fields.zuweisung_beginn || '';
      const timeB = b.shift.fields.zuweisung_beginn || '';
      return timeA.localeCompare(timeB);
    }).slice(0, 15);
  }, [schichten, mitarbeiterMap, schichtartMap, today]);

  // Group upcoming by date
  const upcomingByDate = useMemo(() => {
    const groups = new Map<string, typeof upcomingShifts>();
    upcomingShifts.forEach(item => {
      const date = item.shift.fields.zuweisung_datum || '';
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(item);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [upcomingShifts]);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: Schichteinteilung['fields'] = {
        zuweisung_datum: formData.datum,
        zuweisung_beginn: formData.beginn,
        zuweisung_ende: formData.ende,
        zuweisung_notiz: formData.notiz || undefined,
        zuweisung_mitarbeiter: formData.mitarbeiter
          ? createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, formData.mitarbeiter)
          : undefined,
        zuweisung_schichtart: formData.schichtart
          ? createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, formData.schichtart)
          : undefined,
        zuweisung_unternehmen: formData.unternehmen
          ? createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, formData.unternehmen)
          : undefined,
      };

      await LivingAppsService.createSchichteinteilungEntry(data);

      // Refresh data
      const newSchichten = await LivingAppsService.getSchichteinteilung();
      setSchichten(newSchichten);

      // Reset form
      setFormData({
        datum: format(new Date(), 'yyyy-MM-dd'),
        mitarbeiter: '',
        schichtart: '',
        unternehmen: '',
        beginn: '06:00',
        ende: '14:00',
        notiz: '',
      });
      setDialogOpen(false);
    } catch (err) {
      console.error('Fehler beim Erstellen:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Fehler beim Laden</h2>
                <p className="text-muted-foreground text-sm">{error.message}</p>
              </div>
              <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Schichtplaner</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 hidden md:flex">
                <Plus className="h-4 w-4" />
                Neue Schicht
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
                    onChange={e => setFormData(f => ({ ...f, datum: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mitarbeiter">Mitarbeiter</Label>
                  <Select
                    value={formData.mitarbeiter || 'none'}
                    onValueChange={v => setFormData(f => ({ ...f, mitarbeiter: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Mitarbeiter auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Mitarbeiter auswählen...</SelectItem>
                      {mitarbeiter.map(m => (
                        <SelectItem key={m.record_id} value={m.record_id}>
                          {m.fields.mitarbeiter_vorname} {m.fields.mitarbeiter_nachname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schichtart">Schichtart</Label>
                  <Select
                    value={formData.schichtart || 'none'}
                    onValueChange={v => setFormData(f => ({ ...f, schichtart: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Schichtart auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Schichtart auswählen...</SelectItem>
                      {schichtarten.map(s => (
                        <SelectItem key={s.record_id} value={s.record_id}>
                          {s.fields.schichtart_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {unternehmen.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="unternehmen">Unternehmen</Label>
                    <Select
                      value={formData.unternehmen || 'none'}
                      onValueChange={v => setFormData(f => ({ ...f, unternehmen: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Unternehmen auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unternehmen auswählen...</SelectItem>
                        {unternehmen.map(u => (
                          <SelectItem key={u.record_id} value={u.record_id}>
                            {u.fields.unternehmen_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beginn">Beginn</Label>
                    <Input
                      id="beginn"
                      type="time"
                      value={formData.beginn}
                      onChange={e => setFormData(f => ({ ...f, beginn: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ende">Ende</Label>
                    <Input
                      id="ende"
                      type="time"
                      value={formData.ende}
                      onChange={e => setFormData(f => ({ ...f, ende: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notiz">Notiz (optional)</Label>
                  <Input
                    id="notiz"
                    value={formData.notiz}
                    onChange={e => setFormData(f => ({ ...f, notiz: e.target.value }))}
                    placeholder="Optionale Anmerkungen..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Wird gespeichert...' : 'Schicht eintragen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - 60% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero Card - Today's Shifts */}
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 pb-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Main Hero Number */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Heute</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-extrabold text-primary">
                        {todayShifts.length}
                      </span>
                      <span className="text-xl text-muted-foreground font-medium">
                        {todayShifts.length === 1 ? 'Schicht' : 'Schichten'}
                      </span>
                    </div>
                    {todayTimeRange && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {todayTimeRange.start} - {todayTimeRange.end}
                      </p>
                    )}
                  </div>

                  {/* Employee Avatars */}
                  {todayEmployees.length > 0 && (
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <p className="text-xs text-muted-foreground">Mitarbeiter heute</p>
                      <div className="flex -space-x-2">
                        {todayEmployees.slice(0, 6).map((emp, i) => {
                          const name = `${emp.fields.mitarbeiter_vorname || ''} ${emp.fields.mitarbeiter_nachname || ''}`.trim();
                          return (
                            <div
                              key={emp.record_id}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white border-2 border-card"
                              style={{ backgroundColor: getAvatarColor(name), zIndex: 10 - i }}
                              title={name}
                            >
                              {getInitials(emp.fields.mitarbeiter_vorname, emp.fields.mitarbeiter_nachname)}
                            </div>
                          );
                        })}
                        {todayEmployees.length > 6 && (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold bg-muted text-muted-foreground border-2 border-card">
                            +{todayEmployees.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Diese Woche:</span>
                    <span className="font-semibold">{weekShifts.length} Schichten</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{weekEmployeesCount} Mitarbeiter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{weekSchichtartenCount} Schichtarten</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Overview Chart */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Wochenübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekChartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(230 10% 45%)"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="hsl(230 10% 45%)"
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(40 20% 90%)',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                        formatter={(value: number) => [`${value} Schichten`, '']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {weekChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isToday ? 'hsl(243 75% 58%)' : 'hsl(243 75% 85%)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Nächste Schichten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingByDate.length === 0 ? (
                  <div className="px-6 pb-6 text-center">
                    <p className="text-muted-foreground text-sm">Keine Schichten in den nächsten 7 Tagen</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Schicht eintragen
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {upcomingByDate.map(([date, shifts]) => {
                      const dateObj = parseISO(date);
                      const isTodayDate = isSameDay(dateObj, today);
                      return (
                        <div key={date}>
                          <div className={`sticky top-0 px-6 py-2 text-xs font-semibold uppercase tracking-wider ${isTodayDate ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {isTodayDate ? 'Heute' : format(dateObj, 'EEEE, d. MMM', { locale: de })}
                          </div>
                          <div className="divide-y">
                            {shifts.map((item) => (
                              <div
                                key={item.shift.record_id}
                                className="px-6 py-3 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {item.employee && (
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                        style={{
                                          backgroundColor: getAvatarColor(
                                            `${item.employee.fields.mitarbeiter_vorname || ''} ${item.employee.fields.mitarbeiter_nachname || ''}`
                                          ),
                                        }}
                                      >
                                        {getInitials(
                                          item.employee.fields.mitarbeiter_vorname,
                                          item.employee.fields.mitarbeiter_nachname
                                        )}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">
                                        {item.employee
                                          ? `${item.employee.fields.mitarbeiter_vorname || ''} ${item.employee.fields.mitarbeiter_nachname || ''}`.trim()
                                          : 'Kein Mitarbeiter'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.shift.fields.zuweisung_beginn} - {item.shift.fields.zuweisung_ende}
                                      </p>
                                    </div>
                                  </div>
                                  {item.schichtart && (
                                    <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                      {item.schichtart.fields.schichtart_name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-base gap-2">
              <Plus className="h-5 w-5" />
              Neue Schicht
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Spacer for fixed button on mobile */}
      <div className="h-24 md:hidden" />
    </div>
  );
}
