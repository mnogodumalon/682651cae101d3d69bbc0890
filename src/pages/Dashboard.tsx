import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Mitarbeiterverwaltung,
  Schichteinteilung,
  Schichtartenverwaltung,
  Unternehmensverwaltung,
} from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  addDays,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
} from 'date-fns';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Layers3,
  Users,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type EnrichedShift = {
  record: Schichteinteilung;
  date: Date | null;
  dateKey: string | null;
  dateTime: Date | null;
  timeRange: string;
  employeeName: string;
  companyName: string;
  shiftTypeName: string;
  shiftTypeTime: string;
  note?: string;
};

type RibbonDay = {
  label: string;
  dateKey: string;
  count: number;
};

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function formatNumber(value: number) {
  return new Intl.NumberFormat('de-DE').format(value);
}

function getDateKey(value?: string) {
  if (!value) return null;
  return value.slice(0, 10);
}

function getDayLabel(date: Date) {
  return DAY_LABELS[date.getDay()];
}

function formatShortDate(date: Date) {
  return `${getDayLabel(date)}, ${format(date, 'dd.MM')}`;
}

function formatTimeRange(start?: string, end?: string) {
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - --`;
  if (end) return `-- - ${end}`;
  return '-- - --';
}

function buildDateTime(baseDate: Date, time?: string) {
  if (!time) return new Date(baseDate);
  const [hour, minute] = time.split(':');
  if (!hour || !minute) return new Date(baseDate);
  const result = new Date(baseDate);
  result.setHours(Number(hour), Number(minute), 0, 0);
  return result;
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-[160px] border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
      <div className="font-medium text-foreground">{title}</div>
      <div className="mt-1">{description}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-[320px] w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-24 w-40" />
              <Skeleton className="h-24 w-40" />
              <Skeleton className="h-24 w-40" />
            </div>
            <Skeleton className="h-[280px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[260px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-card px-3 py-2 text-xs shadow-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{payload[0].value} Schichten</div>
    </div>
  );
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [assignments, setAssignments] = useState<Schichteinteilung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EnrichedShift | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    datum: '',
    beginn: '',
    ende: '',
    notiz: '',
    mitarbeiterId: '',
    unternehmenId: '',
    schichtartId: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [companyData, shiftTypeData, assignmentData, employeeData] =
        await Promise.all([
          LivingAppsService.getUnternehmensverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
        ]);
      setCompanies(companyData);
      setShiftTypes(shiftTypeData);
      setAssignments(assignmentData);
      setEmployees(employeeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!createOpen) {
      setFormError(null);
      setFormData({
        datum: '',
        beginn: '',
        ende: '',
        notiz: '',
        mitarbeiterId: '',
        unternehmenId: '',
        schichtartId: '',
      });
    }
  }, [createOpen]);

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.record_id, company])),
    [companies]
  );
  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.record_id, employee])),
    [employees]
  );
  const shiftTypeMap = useMemo(
    () => new Map(shiftTypes.map((shiftType) => [shiftType.record_id, shiftType])),
    [shiftTypes]
  );

  const enrichedAssignments = useMemo<EnrichedShift[]>(() => {
    return assignments.map((assignment) => {
      const dateKey = getDateKey(assignment.fields.zuweisung_datum);
      const date = dateKey ? parseISO(dateKey) : null;
      const safeDate = date && !Number.isNaN(date.getTime()) ? date : null;
      const dateTime = safeDate
        ? buildDateTime(safeDate, assignment.fields.zuweisung_beginn)
        : null;
      const employeeId = extractRecordId(assignment.fields.zuweisung_mitarbeiter);
      const companyId = extractRecordId(assignment.fields.zuweisung_unternehmen);
      const shiftTypeId = extractRecordId(assignment.fields.zuweisung_schichtart);
      const employee = employeeId ? employeeMap.get(employeeId) : null;
      const company = companyId ? companyMap.get(companyId) : null;
      const shiftType = shiftTypeId ? shiftTypeMap.get(shiftTypeId) : null;
      const employeeName = employee
        ? [employee.fields.mitarbeiter_vorname, employee.fields.mitarbeiter_nachname]
            .filter(Boolean)
            .join(' ')
        : 'Unbekannter Mitarbeiter';
      const companyName = company?.fields.unternehmen_name || 'Unbekanntes Unternehmen';
      const shiftTypeName = shiftType?.fields.schichtart_name || 'Schicht';
      const shiftTypeTime = formatTimeRange(
        shiftType?.fields.schichtart_beginn,
        shiftType?.fields.schichtart_ende
      );
      return {
        record: assignment,
        date: safeDate,
        dateKey,
        dateTime,
        timeRange: formatTimeRange(
          assignment.fields.zuweisung_beginn,
          assignment.fields.zuweisung_ende
        ),
        employeeName,
        companyName,
        shiftTypeName,
        shiftTypeTime,
        note: assignment.fields.zuweisung_notiz,
      };
    });
  }, [assignments, companyMap, employeeMap, shiftTypeMap]);

  const today = startOfDay(new Date());
  const todayKey = format(today, 'yyyy-MM-dd');
  const tomorrowKey = format(addDays(today, 1), 'yyyy-MM-dd');

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    enrichedAssignments.forEach((assignment) => {
      if (!assignment.dateKey) return;
      map.set(assignment.dateKey, (map.get(assignment.dateKey) || 0) + 1);
    });
    return map;
  }, [enrichedAssignments]);

  const shiftsNext7 = useMemo(() => {
    const end = addDays(today, 6);
    return enrichedAssignments.filter((assignment) => {
      if (!assignment.date) return false;
      return isWithinInterval(assignment.date, { start: today, end });
    }).length;
  }, [enrichedAssignments, today]);

  const shiftsToday = countsByDate.get(todayKey) || 0;
  const shiftsTomorrow = countsByDate.get(tomorrowKey) || 0;

  const ribbonData = useMemo<RibbonDay[]>(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(today, index);
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        label: getDayLabel(date),
        dateKey,
        count: countsByDate.get(dateKey) || 0,
      };
    });
  }, [countsByDate, today]);

  const chartDays = isMobile ? 7 : 14;
  const chartData = useMemo(() => {
    return Array.from({ length: chartDays }).map((_, index) => {
      const date = addDays(today, index);
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        label: isMobile ? getDayLabel(date) : format(date, 'dd.MM'),
        count: countsByDate.get(dateKey) || 0,
      };
    });
  }, [chartDays, countsByDate, isMobile, today]);

  const upcomingLimit = isMobile ? 5 : 6;
  const upcomingShifts = useMemo(() => {
    return enrichedAssignments
      .filter((assignment) => assignment.dateTime && assignment.dateTime >= today)
      .sort((a, b) => {
        if (!a.dateTime || !b.dateTime) return 0;
        return a.dateTime.getTime() - b.dateTime.getTime();
      })
      .slice(0, upcomingLimit);
  }, [enrichedAssignments, upcomingLimit, today]);

  const teamLimit = 4;
  const teamList = useMemo(() => {
    return [...employees]
      .sort((a, b) => b.createdat.localeCompare(a.createdat))
      .slice(0, teamLimit);
  }, [employees]);

  const companyLimit = 4;
  const companyList = useMemo(() => {
    return [...companies]
      .sort((a, b) => b.createdat.localeCompare(a.createdat))
      .slice(0, companyLimit);
  }, [companies]);

  const shiftTypeList = useMemo(() => {
    return [...shiftTypes].sort((a, b) =>
      (a.fields.schichtart_name || '').localeCompare(b.fields.schichtart_name || '')
    );
  }, [shiftTypes]);

  const maxRibbonCount = Math.max(1, ...ribbonData.map((day) => day.count));
  const todayLabel = format(today, 'dd.MM.yyyy');

  const handleCreateShift = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.datum || !formData.mitarbeiterId || !formData.unternehmenId || !formData.schichtartId) {
      setFormError('Bitte alle Pflichtfelder ausfuellen.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await LivingAppsService.createSchichteinteilungEntry({
        zuweisung_datum: formData.datum,
        zuweisung_beginn: formData.beginn || undefined,
        zuweisung_ende: formData.ende || undefined,
        zuweisung_notiz: formData.notiz || undefined,
        zuweisung_mitarbeiter: createRecordUrl(
          APP_IDS.MITARBEITERVERWALTUNG,
          formData.mitarbeiterId
        ),
        zuweisung_unternehmen: createRecordUrl(
          APP_IDS.UNTERNEHMENSVERWALTUNG,
          formData.unternehmenId
        ),
        zuweisung_schichtart: createRecordUrl(
          APP_IDS.SCHICHTARTENVERWALTUNG,
          formData.schichtartId
        ),
      });
      toast.success('Schicht angelegt', {
        description: 'Die Schichteinteilung wurde gespeichert.',
      });
      setCreateOpen(false);
      loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>{error.message}</span>
              <Button variant="outline" onClick={loadData}>
                Erneut versuchen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(700px circle at top left, hsl(24 78% 48% / 0.08), transparent 60%), linear-gradient(135deg, hsl(36 32% 94% / 0.7), transparent 45%)',
        }}
      />
      <Toaster position="top-right" theme="light" />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Schichtplaner</h1>
            <p className="hidden text-sm text-muted-foreground lg:block">Uebersicht</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground lg:hidden">{todayLabel}</span>
            <Button
              className="hidden h-10 rounded-lg px-4 text-sm shadow-sm lg:inline-flex"
              onClick={() => setCreateOpen(true)}
            >
              Schicht einteilen
            </Button>
          </div>
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <Card className="min-h-[45vh] border-border/80 shadow-sm transition-shadow hover:shadow-md md:min-h-[320px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schichten naechste 7 Tage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-5xl font-semibold tracking-tight">
                    {formatNumber(shiftsNext7)}
                  </div>
                  <div className="text-sm text-muted-foreground">geplant</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Heute: {formatNumber(shiftsToday)} | Morgen: {formatNumber(shiftsTomorrow)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    {ribbonData.map((day) => {
                      const height = Math.max(6, Math.round((day.count / maxRibbonCount) * 42));
                      return (
                        <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-full bg-accent/70"
                            style={{ height }}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Wochenband: Balkenhoehe = Anzahl Schichten
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 lg:overflow-visible">
              <StatCard
                title="Schichten heute"
                value={formatNumber(shiftsToday)}
                icon={Calendar}
              />
              <StatCard
                title="Mitarbeiter"
                value={formatNumber(employees.length)}
                icon={Users}
              />
              <StatCard
                title="Schichtarten"
                value={formatNumber(shiftTypes.length)}
                icon={Layers3}
              />
              <StatCard
                title="Unternehmen"
                value={formatNumber(companies.length)}
                icon={Building2}
              />
            </div>

            <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schichten pro Tag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="shiftArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#shiftArea)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="flex flex-col gap-6">
            <Card className="order-1 border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Naechste Schichten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingShifts.length === 0 ? (
                  <EmptyState
                    title="Noch keine Schichten"
                    description="Lege die erste Schicht an, um den Plan zu starten."
                    action={
                      <Button onClick={() => setCreateOpen(true)} size="sm">
                        Schicht einteilen
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3 lg:space-y-0 lg:divide-y lg:divide-border/70">
                    {upcomingShifts.map((shift) => (
                      <button
                        key={shift.record.record_id}
                        type="button"
                        className="group w-full rounded-lg border border-border/70 bg-card p-3 text-left transition-shadow hover:shadow-md lg:border-0 lg:bg-transparent lg:px-0 lg:py-3"
                        onClick={() => {
                          setSelectedShift(shift);
                          setDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {shift.date ? formatShortDate(shift.date) : 'Kein Datum'}
                            </div>
                            <div className="text-xs text-muted-foreground">{shift.timeRange}</div>
                          </div>
                          <span
                            className={`mt-1 h-2 w-2 rounded-full ${
                              shift.note ? 'bg-accent' : 'bg-muted'
                            }`}
                          />
                        </div>
                        <div className="mt-2 text-sm font-medium text-foreground">
                          {shift.employeeName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{shift.companyName}</span>
                          <span>•</span>
                          <span>{shift.shiftTypeName}</span>
                        </div>
                        {shift.note ? (
                          <div className="mt-2 hidden text-xs text-muted-foreground group-hover:block">
                            Notiz: {shift.note}
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="order-2 border-border/80 shadow-sm transition-shadow hover:shadow-md lg:order-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Schichtarten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shiftTypeList.length === 0 ? (
                  <EmptyState
                    title="Keine Schichtarten"
                    description="Lege Schichtarten an, um sie hier zu sehen."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {shiftTypeList.map((shiftType) => (
                      <div
                        key={shiftType.record_id}
                        className="flex items-center gap-2 rounded-full border border-accent/40 bg-muted/40 px-3 py-2 text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {shiftType.fields.schichtart_name || 'Schicht'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTimeRange(
                            shiftType.fields.schichtart_beginn,
                            shiftType.fields.schichtart_ende
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="order-3 border-border/80 shadow-sm transition-shadow hover:shadow-md lg:order-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamList.length === 0 ? (
                  <EmptyState
                    title="Keine Mitarbeiter"
                    description="Fuege Mitarbeitende hinzu, um sie hier zu sehen."
                  />
                ) : (
                  teamList.map((employee) => {
                    const name = [
                      employee.fields.mitarbeiter_vorname,
                      employee.fields.mitarbeiter_nachname,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const contact =
                      employee.fields.mitarbeiter_email ||
                      employee.fields.mitarbeiter_telefon ||
                      'Keine Kontaktdaten';
                    return (
                      <div
                        key={employee.record_id}
                        className="rounded-lg border border-border/70 bg-card p-3 text-sm lg:border-0 lg:bg-transparent lg:px-0"
                      >
                        <div>
                          <div className="font-medium text-foreground">
                            {name || 'Unbekannter Mitarbeiter'}
                          </div>
                          <div className="text-xs text-muted-foreground">{contact}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="order-4 border-border/80 shadow-sm transition-shadow hover:shadow-md lg:order-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unternehmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyList.length === 0 ? (
                  <EmptyState
                    title="Keine Unternehmen"
                    description="Fuege Unternehmen hinzu, um sie hier zu sehen."
                  />
                ) : (
                  companyList.map((company) => {
                    const location = [
                      company.fields.unternehmen_plz,
                      company.fields.unternehmen_ort,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <div
                        key={company.record_id}
                        className="rounded-lg border border-border/70 bg-card p-3 text-sm lg:border-0 lg:bg-transparent lg:px-0"
                      >
                        <div className="font-medium text-foreground">
                          {company.fields.unternehmen_name || 'Unbekanntes Unternehmen'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {location || 'Kein Standort'}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>

      <Button
        className="fixed bottom-4 left-4 right-4 h-14 rounded-xl text-base shadow-lg lg:hidden"
        onClick={() => setCreateOpen(true)}
      >
        Schicht einteilen
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schicht einteilen</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateShift}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="datum">Datum</Label>
                <Input
                  id="datum"
                  type="date"
                  value={formData.datum}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, datum: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Schichtart</Label>
                <Select
                  value={formData.schichtartId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, schichtartId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Schichtart waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypeList.length === 0 ? (
                      <SelectItem value="no-shift-types" disabled>
                        Keine Schichtarten
                      </SelectItem>
                    ) : (
                      shiftTypeList.map((shiftType) => (
                        <SelectItem key={shiftType.record_id} value={shiftType.record_id}>
                          {shiftType.fields.schichtart_name || 'Schicht'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mitarbeiter</Label>
                <Select
                  value={formData.mitarbeiterId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, mitarbeiterId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <SelectItem value="no-employees" disabled>
                        Keine Mitarbeiter
                      </SelectItem>
                    ) : (
                      employees.map((employee) => {
                        const name = [
                          employee.fields.mitarbeiter_vorname,
                          employee.fields.mitarbeiter_nachname,
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <SelectItem key={employee.record_id} value={employee.record_id}>
                            {name || 'Unbekannter Mitarbeiter'}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unternehmen</Label>
                <Select
                  value={formData.unternehmenId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, unternehmenId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unternehmen waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.length === 0 ? (
                      <SelectItem value="no-companies" disabled>
                        Keine Unternehmen
                      </SelectItem>
                    ) : (
                      companies.map((company) => (
                        <SelectItem key={company.record_id} value={company.record_id}>
                          {company.fields.unternehmen_name || 'Unbekanntes Unternehmen'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="beginn">Beginn</Label>
                <Input
                  id="beginn"
                  type="time"
                  value={formData.beginn}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, beginn: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ende">Ende</Label>
                <Input
                  id="ende"
                  type="time"
                  value={formData.ende}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, ende: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notiz">Notiz</Label>
              <Textarea
                id="notiz"
                value={formData.notiz}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, notiz: event.target.value }))
                }
                placeholder="Optionale Notiz"
              />
            </div>

            {formError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Speichern...' : 'Schicht speichern'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedShift(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schichtdetails</DialogTitle>
          </DialogHeader>
          {selectedShift ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Datum</div>
                <div className="font-medium text-foreground">
                  {selectedShift.date ? formatShortDate(selectedShift.date) : 'Kein Datum'}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Zeit</div>
                  <div className="font-medium text-foreground">
                    {selectedShift.timeRange}
                  </div>
                </div>
                <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">Schichtart</div>
                  <div className="font-medium text-foreground">
                    {selectedShift.shiftTypeName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedShift.shiftTypeTime}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Mitarbeiter</div>
                <div className="font-medium text-foreground">
                  {selectedShift.employeeName}
                </div>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Unternehmen</div>
                <div className="font-medium text-foreground">
                  {selectedShift.companyName}
                </div>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Notiz</div>
                <div className="font-medium text-foreground">
                  {selectedShift.note || 'Keine Notiz'}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
