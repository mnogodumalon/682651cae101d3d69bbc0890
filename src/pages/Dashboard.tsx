import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Badge as BadgeIcon,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Factory,
  ListChecks,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type {
  CreateSchichteinteilung,
  Mitarbeiterverwaltung,
  Schichtartenverwaltung,
  Schichteinteilung,
  Unternehmensverwaltung,
} from '@/types/app';
import { APP_IDS } from '@/types/app';
import {
  LivingAppsService,
  createRecordUrl,
  extractRecordId,
} from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  parse,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';

type EnrichedAssignment = Schichteinteilung & {
  employee?: Mitarbeiterverwaltung;
  company?: Unternehmensverwaltung;
  shiftType?: Schichtartenverwaltung;
};

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const DEFAULT_GOAL = 12;

function combineDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const safeTime = timeStr && /^\d{1,2}:\d{2}$/.test(timeStr) ? timeStr : '12:00';
  const value = `${dateStr}T${safeTime}`;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateLabel(dateStr?: string) {
  if (!dateStr) return 'Ohne Datum';
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
  } catch (e) {
    return dateStr;
  }
}

function formatTimeRange(start?: string, end?: string) {
  if (!start && !end) return 'Zeit offen';
  if (!start) return `bis ${end}`;
  if (!end) return `${start} - ?`;
  return `${start} - ${end}`;
}

function getEmployeeName(employee?: Mitarbeiterverwaltung) {
  if (!employee) return 'Unbesetzt';
  const { mitarbeiter_vorname, mitarbeiter_nachname } = employee.fields;
  return [mitarbeiter_vorname, mitarbeiter_nachname].filter(Boolean).join(' ') || 'Unbenannter Mitarbeiter';
}

const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <Card className="border-dashed shadow-none">
    <CardContent className="flex flex-col items-start gap-3 py-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-accent" />
        <div>
          <p className="text-lg font-semibold">Noch keine Daten</p>
          <p className="text-sm text-muted-foreground">
            Lege deine erste Schicht an, um das Dashboard zu füllen.
          </p>
        </div>
      </div>
      <Button onClick={onRetry} variant="outline">
        Neu laden
      </Button>
    </CardContent>
  </Card>
);

function KPIChip({
  title,
  value,
  subtitle,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        'min-w-[180px] border-none shadow-[0_8px_16px_rgba(34,41,47,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(34,41,47,0.08)]',
        highlight && 'bg-primary text-primary-foreground',
      )}
    >
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground',
            highlight && 'bg-primary-foreground/20 text-primary-foreground',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className={cn('text-sm text-muted-foreground', highlight && 'text-primary-foreground/80')}>
            {title}
          </p>
          <p className="text-xl font-semibold leading-tight">{value}</p>
          {subtitle && (
            <p className={cn('text-xs text-muted-foreground', highlight && 'text-primary-foreground/80')}>
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AddShiftDialog({
  employees,
  companies,
  shiftTypes,
  onSuccess,
  trigger,
}: {
  employees: Mitarbeiterverwaltung[];
  companies: Unternehmensverwaltung[];
  shiftTypes: Schichtartenverwaltung[];
  onSuccess: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    employeeId?: string;
    companyId?: string;
    shiftTypeId?: string;
    date?: string;
    start?: string;
    end?: string;
    note?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setForm((prev) => ({
      ...prev,
      date: prev.date ?? today,
    }));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!form.employeeId || !form.companyId || !form.shiftTypeId || !form.date || !form.start || !form.end) {
      setError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    const payload: CreateSchichteinteilung = {
      zuweisung_mitarbeiter: createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, form.employeeId),
      zuweisung_unternehmen: createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, form.companyId),
      zuweisung_schichtart: createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, form.shiftTypeId),
      zuweisung_datum: form.date,
      zuweisung_beginn: form.start,
      zuweisung_ende: form.end,
      ...(form.note ? { zuweisung_notiz: form.note } : {}),
    };

    try {
      setSubmitting(true);
      await LivingAppsService.createSchichteinteilungEntry(payload);
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schicht zuweisen</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Erstelle eine neue Schichteinteilung mit Mitarbeiter, Unternehmen und Schichtart.
          </p>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mitarbeiter *</Label>
              <Select
                value={form.employeeId ?? 'none'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, employeeId: value === 'none' ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auswählen</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.record_id} value={emp.record_id}>
                      {getEmployeeName(emp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unternehmen *</Label>
              <Select
                value={form.companyId ?? 'none'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, companyId: value === 'none' ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auswählen</SelectItem>
                  {companies.map((comp) => (
                    <SelectItem key={comp.record_id} value={comp.record_id}>
                      {comp.fields.unternehmen_name ?? 'Ohne Namen'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Schichtart *</Label>
              <Select
                value={form.shiftTypeId ?? 'none'}
                onValueChange={(value) =>
                  setForm((prev) => {
                    const selected = shiftTypes.find((s) => s.record_id === value);
                    return {
                      ...prev,
                      shiftTypeId: value === 'none' ? undefined : value,
                      start: selected?.fields.schichtart_beginn ?? prev.start,
                      end: selected?.fields.schichtart_ende ?? prev.end,
                    };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Auswählen</SelectItem>
                  {shiftTypes.map((type) => (
                    <SelectItem key={type.record_id} value={type.record_id}>
                      {type.fields.schichtart_name ?? 'Ohne Titel'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Datum *</Label>
              <Input
                type="date"
                value={form.date ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Beginn *</Label>
              <Input
                type="time"
                value={form.start ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ende *</Label>
              <Input
                type="time"
                value={form.end ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notiz</Label>
            <Textarea
              rows={3}
              placeholder="Optionale Hinweise zur Schicht"
              value={form.note ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Speichern...' : 'Schicht speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HeroCard({
  assigned,
  goal,
  dateLabel,
  companyLabel,
  onAdjustGoal,
}: {
  assigned: number;
  goal: number;
  dateLabel: string;
  companyLabel: string;
  onAdjustGoal: (value: number) => void;
}) {
  const coverage = goal > 0 ? Math.min((assigned / goal) * 100, 150) : 0;
  const delta = goal - assigned;

  return (
    <Card className="relative overflow-hidden border-none shadow-[0_12px_30px_rgba(34,41,47,0.06)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Heute
            </div>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              {dateLabel}
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Factory className="h-3.5 w-3.5" />
              {companyLabel}
            </Badge>
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Heutige Besetzung</span>
        </div>
        <div className="mt-6 space-y-2">
          <div className="flex items-end gap-3">
            <p className="text-4xl font-semibold text-foreground">
              {assigned}/{goal}
            </p>
            <p className="pb-1 text-sm text-muted-foreground">besetzt</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2
              className={cn(
                'h-4 w-4',
                coverage >= 100 ? 'text-[var(--chart-2)]' : 'text-accent',
              )}
            />
            {coverage >= 100 ? 'Ziel erreicht' : `${delta} Plätze frei`}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Progress value={goal === 0 ? 0 : Math.min((assigned / goal) * 100, 100)} className="h-3" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{goal}</span>
            <span className="text-muted-foreground">geplante Plätze</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Ziel anpassen</Label>
            <Input
              type="number"
              min={Math.max(assigned, 1)}
              value={goal}
              onChange={(e) => onAdjustGoal(Number(e.target.value))}
              className="h-10 w-24 border-border bg-muted/60"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NextShifts({
  assignments,
  loading,
}: {
  assignments: EnrichedAssignment[];
  loading: boolean;
}) {
  return (
    <Card className="h-full border-none shadow-[0_12px_30px_rgba(34,41,47,0.06)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Nächste Schichten</CardTitle>
          <Badge className="gap-1 bg-secondary text-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            bald
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Aufsteigend nach Datum und Beginn.</p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-3">
              {assignments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Keine anstehenden Schichten in diesem Zeitraum.
                </p>
              )}
              {assignments.map((item) => (
                <div
                  key={item.record_id}
                  className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_10px_24px_rgba(34,41,47,0.08)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold">{getEmployeeName(item.employee)}</span>
                      <Badge variant="secondary" className="gap-1">
                        <Factory className="h-3 w-3" />
                        {item.company?.fields.unternehmen_name ?? 'Kein Unternehmen'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge className="bg-primary/15 text-primary">
                        {item.shiftType?.fields.schichtart_name ?? 'Schichtart offen'}
                      </Badge>
                      <span>{formatDateLabel(item.fields.zuweisung_datum)}</span>
                      <span>•</span>
                      <span>{formatTimeRange(item.fields.zuweisung_beginn, item.fields.zuweisung_ende)}</span>
                      {item.fields.zuweisung_notiz && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <BadgeIcon className="h-3 w-3" />
                          Notiz
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Schichteinteilung[]>([]);
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [goalOverride, setGoalOverride] = useState<number | null>(null);
  const [rangeFilter, setRangeFilter] = useState<'week' | 'next' | 'all'>('week');

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const fetchData = async () => {
    setError(null);
    try {
      setLoading(true);
      const [assignmentData, companyData, shiftTypeData, employeeData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getUnternehmensverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getMitarbeiterverwaltung(),
      ]);
      setAssignments(assignmentData);
      setCompanies(companyData);
      setShiftTypes(shiftTypeData);
      setEmployees(employeeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const coverageGoal = goalOverride ?? Math.max(shiftTypes.length || 0, DEFAULT_GOAL);

  const assignmentMap = useMemo(() => {
    const employeeMap = new Map<string, Mitarbeiterverwaltung>();
    employees.forEach((emp) => employeeMap.set(emp.record_id, emp));
    const companyMap = new Map<string, Unternehmensverwaltung>();
    companies.forEach((c) => companyMap.set(c.record_id, c));
    const shiftTypeMap = new Map<string, Schichtartenverwaltung>();
    shiftTypes.forEach((s) => shiftTypeMap.set(s.record_id, s));

    return { employeeMap, companyMap, shiftTypeMap };
  }, [employees, companies, shiftTypes]);

  const assignmentsWithRefs: EnrichedAssignment[] = useMemo(
    () =>
      assignments.map((item) => {
        const employeeId = extractRecordId(item.fields.zuweisung_mitarbeiter);
        const companyId = extractRecordId(item.fields.zuweisung_unternehmen);
        const shiftTypeId = extractRecordId(item.fields.zuweisung_schichtart);
        return {
          ...item,
          employee: employeeId ? assignmentMap.employeeMap.get(employeeId) : undefined,
          company: companyId ? assignmentMap.companyMap.get(companyId) : undefined,
          shiftType: shiftTypeId ? assignmentMap.shiftTypeMap.get(shiftTypeId) : undefined,
        };
      }),
    [assignments, assignmentMap],
  );

  const todaysAssignments = assignmentsWithRefs.filter((item) =>
    item.fields.zuweisung_datum ? isSameDay(parseISO(item.fields.zuweisung_datum), today) : false,
  );

  const weeklyAssignments = assignmentsWithRefs.filter((item) => {
    if (!item.fields.zuweisung_datum) return false;
    const date = parseISO(item.fields.zuweisung_datum);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });

  const weeklyShiftCounts = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map((day) => {
      const label = format(day, 'EE', { locale: de });
      const count = weeklyAssignments.filter((item) => {
        if (!item.fields.zuweisung_datum) return false;
        return isSameDay(parseISO(item.fields.zuweisung_datum), day);
      }).length;
      return { day: label, count };
    });
  }, [weekStart, weekEnd, weeklyAssignments]);

  const shiftTypeMix = useMemo(() => {
    const counter = new Map<string, { name: string; value: number }>();
    weeklyAssignments.forEach((item) => {
      const id = extractRecordId(item.fields.zuweisung_schichtart);
      if (!id) return;
      const name = assignmentMap.shiftTypeMap.get(id)?.fields.schichtart_name ?? 'Ohne Schichtart';
      const existing = counter.get(id);
      counter.set(id, { name, value: (existing?.value ?? 0) + 1 });
    });
    return Array.from(counter.values());
  }, [weeklyAssignments, assignmentMap.shiftTypeMap]);

  const mostUsedShift = shiftTypeMix.reduce<{ name: string; value: number } | null>(
    (acc, item) => {
      if (!acc || item.value > acc.value) return item;
      return acc;
    },
    null,
  );

  const employeesWithoutToday = useMemo(() => {
    const assignedIds = new Set(
      todaysAssignments
        .map((item) => extractRecordId(item.fields.zuweisung_mitarbeiter))
        .filter((id): id is string => Boolean(id)),
    );
    return employees.filter((emp) => !assignedIds.has(emp.record_id)).length;
  }, [todaysAssignments, employees]);

  const freeSlotsToday = Math.max(coverageGoal - todaysAssignments.length, 0);

  const upcomingAssignments = useMemo(() => {
    const now = today;
    const filtered = assignmentsWithRefs.filter((item) => {
      if (!item.fields.zuweisung_datum) return false;
      const dateObj = combineDateTime(item.fields.zuweisung_datum, item.fields.zuweisung_beginn);
      if (!dateObj) return false;
      if (rangeFilter === 'week') {
        return isWithinInterval(dateObj, { start: weekStart, end: weekEnd }) && isAfter(dateObj, addDays(now, -1));
      }
      if (rangeFilter === 'next') {
        return isAfter(dateObj, addDays(now, -1)) && isBefore(dateObj, addDays(now, 7));
      }
      return true;
    });
    return filtered
      .sort((a, b) => {
        const dateA = combineDateTime(a.fields.zuweisung_datum, a.fields.zuweisung_beginn)?.getTime() ?? 0;
        const dateB = combineDateTime(b.fields.zuweisung_datum, b.fields.zuweisung_beginn)?.getTime() ?? 0;
        return dateA - dateB;
      })
      .slice(0, 8);
  }, [assignmentsWithRefs, rangeFilter, weekStart, weekEnd, today]);

  const kpiCards = [
    {
      title: 'Schichten diese Woche',
      value: weeklyAssignments.length.toString(),
      subtitle: 'Montag - Sonntag',
      icon: CalendarRange,
    },
    {
      title: 'Freie Slots heute',
      value: freeSlotsToday.toString(),
      subtitle: 'auf Basis deines Ziels',
      icon: ListChecks,
      highlight: freeSlotsToday > 0,
    },
    {
      title: 'Meistgenutzte Schichtart',
      value: mostUsedShift ? mostUsedShift.name : 'Keine Daten',
      subtitle: mostUsedShift ? `${mostUsedShift.value} Einsätze` : 'Woche noch leer',
      icon: Sparkles,
    },
    {
      title: 'Mitarbeiter ohne Schicht heute',
      value: employeesWithoutToday.toString(),
      subtitle: 'noch nicht eingeplant',
      icon: Users,
      highlight: employeesWithoutToday > 0,
    },
  ];

  const heroDateLabel = format(today, 'EEE, dd. MMM', { locale: de });
  const companyLabel = companies.length > 0 ? companies[0].fields.unternehmen_name ?? 'Alle Unternehmen' : 'Alle Unternehmen';

  if (error) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{error.message}</span>
              <Button variant="outline" onClick={fetchData}>
                Erneut laden
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const noData =
    !loading &&
    assignmentsWithRefs.length === 0 &&
    employees.length === 0 &&
    companies.length === 0 &&
    shiftTypes.length === 0;

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Schichtplaner</p>
            <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Überblick über heutige Besetzung, kommende Schichten und Wochenlast.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={rangeFilter} onValueChange={(value) => setRangeFilter(value as 'week' | 'next' | 'all')}>
              <SelectTrigger className="w-[170px] border-border">
                <SelectValue placeholder="Zeitraum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="next">Nächste 7 Tage</SelectItem>
                <SelectItem value="all">Alle Schichten</SelectItem>
              </SelectContent>
            </Select>
            <AddShiftDialog
              employees={employees}
              companies={companies}
              shiftTypes={shiftTypes}
              onSuccess={fetchData}
              trigger={
                <Button className="gap-2 shadow-[0_12px_24px_rgba(34,41,47,0.12)]">
                  <Plus className="h-4 w-4" />
                  Schicht zuweisen
                </Button>
              }
            />
          </div>
        </header>

        {noData ? (
          <EmptyState onRetry={fetchData} />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {loading ? (
                  <Skeleton className="h-[260px] w-full rounded-2xl" />
                ) : (
                  <HeroCard
                    assigned={todaysAssignments.length}
                    goal={coverageGoal}
                    dateLabel={heroDateLabel}
                    companyLabel={companyLabel}
                    onAdjustGoal={(value) => setGoalOverride(Number(value) || coverageGoal)}
                  />
                )}
              </div>
              <div className="lg:col-span-1">
                <NextShifts assignments={upcomingAssignments} loading={loading} />
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {kpiCards.map((kpi) => (
                <KPIChip
                  key={kpi.title}
                  title={kpi.title}
                  value={kpi.value}
                  subtitle={kpi.subtitle}
                  icon={kpi.icon}
                  highlight={kpi.highlight}
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-[0_12px_30px_rgba(34,41,47,0.06)]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Wochenübersicht</CardTitle>
                    <p className="text-sm text-muted-foreground">Schichten pro Tag</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <ListChecks className="h-4 w-4" />
                    {weeklyAssignments.length} geplant
                  </Badge>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {loading ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyShiftCounts} barSize={28}>
                        <XAxis
                          dataKey="day"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                          }}
                        />
                        <Bar radius={[10, 10, 8, 8]} dataKey="count" fill="var(--primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border-none shadow-[0_12px_30px_rgba(34,41,47,0.06)]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Schichtarten-Mix</CardTitle>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        Woche
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <Skeleton className="h-[200px] w-full rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={shiftTypeMix}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                              >
                                {shiftTypeMix.map((_, idx) => (
                                  <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '12px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2">
                          {shiftTypeMix.length === 0 && (
                            <p className="text-sm text-muted-foreground">Noch keine Schichtarten diese Woche.</p>
                          )}
                          {shiftTypeMix.map((item, idx) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-lg bg-secondary/80 px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                                />
                                <span>{item.name}</span>
                              </div>
                              <span className="text-muted-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-[0_12px_30px_rgba(34,41,47,0.06)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Sofortmaßnahmen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm">Mitarbeiter ohne Schicht</span>
                      </div>
                      <Badge variant="outline">{employeesWithoutToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-accent" />
                        <span className="text-sm">Freie Slots heute</span>
                      </div>
                      <Badge variant="outline">{freeSlotsToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Top-Schichtart</span>
                      </div>
                      <Badge variant="outline">{mostUsedShift?.name ?? 'Noch offen'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="pointer-events-none fixed bottom-6 right-4 z-50 block sm:hidden">
        <AddShiftDialog
          employees={employees}
          companies={companies}
          shiftTypes={shiftTypes}
          onSuccess={fetchData}
          trigger={
            <Button
              size="lg"
              className="pointer-events-auto h-14 gap-2 rounded-full bg-primary px-6 text-primary-foreground shadow-[0_20px_40px_rgba(34,41,47,0.18)]"
            >
              <Plus className="h-5 w-5" />
              Schicht zuweisen
            </Button>
          }
        />
      </div>
    </div>
  );
}
