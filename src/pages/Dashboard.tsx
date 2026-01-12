import { useState, useEffect, useMemo } from 'react';
import type { Schichteinteilung, Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval, addDays, isBefore, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, Layers, Calendar, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Enriched shift type with resolved relations
interface EnrichedShift {
  shift: Schichteinteilung;
  employee: Mitarbeiterverwaltung | null;
  shiftType: Schichtartenverwaltung | null;
  company: Unternehmensverwaltung | null;
}

// Loading skeleton component
function LoadingState() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="max-w-[1400px] mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Hero skeleton */}
        <Skeleton className="h-64 w-full mb-6 rounded-xl" />

        {/* Stats row skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-6">
          <Skeleton className="h-20 w-28 flex-shrink-0 rounded-xl" />
          <Skeleton className="h-20 w-28 flex-shrink-0 rounded-xl" />
          <Skeleton className="h-20 w-28 flex-shrink-0 rounded-xl" />
        </div>

        {/* Upcoming section skeleton */}
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Fehler beim Laden</AlertTitle>
        <AlertDescription className="mt-2">
          {error.message}
          <button
            onClick={onRetry}
            className="block mt-3 text-sm underline hover:no-underline"
          >
            Erneut versuchen
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold">Schichtplaner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </header>
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Keine Schichten vorhanden</h2>
            <p className="text-muted-foreground text-sm">
              Es wurden noch keine Schichten eingetragen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <Card className="flex-shrink-0 min-w-[100px] py-4 hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-3 p-0 px-4">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Shift item component
function ShiftItem({ enrichedShift, showDate = false }: { enrichedShift: EnrichedShift; showDate?: boolean }) {
  const { shift, employee, shiftType } = enrichedShift;
  const employeeName = employee
    ? `${employee.fields.mitarbeiter_vorname || ''} ${employee.fields.mitarbeiter_nachname || ''}`.trim()
    : 'Unbekannt';
  const shiftTypeName = shiftType?.fields.schichtart_name || 'Schicht';
  const startTime = shift.fields.zuweisung_beginn || '--:--';
  const endTime = shift.fields.zuweisung_ende || '--:--';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors px-1 -mx-1 rounded">
      <div className="flex-1 min-w-0">
        {showDate && shift.fields.zuweisung_datum && (
          <div className="text-xs text-muted-foreground mb-1">
            {format(parseISO(shift.fields.zuweisung_datum), "EEEE, d. MMM", { locale: de })}
          </div>
        )}
        <div className="font-medium truncate">{employeeName}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground border-0">
            {shiftTypeName}
          </Badge>
        </div>
      </div>
      <div className="text-sm text-muted-foreground flex items-center gap-1 ml-3">
        <Clock className="h-3 w-3" />
        {startTime} - {endTime}
      </div>
    </div>
  );
}

// Employee avatar component
function EmployeeAvatar({ employee }: { employee: Mitarbeiterverwaltung }) {
  const firstName = employee.fields.mitarbeiter_vorname || '';
  const lastName = employee.fields.mitarbeiter_nachname || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unbekannt';

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
        {initials}
      </div>
      <span className="text-sm">{fullName}</span>
    </div>
  );
}

export default function Dashboard() {
  const [shifts, setShifts] = useState<Schichteinteilung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // State for mobile "show all" toggle
  const [showAllTodayShifts, setShowAllTodayShifts] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [shiftsData, employeesData, shiftTypesData, companiesData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getUnternehmensverwaltung(),
      ]);
      setShifts(shiftsData);
      setEmployees(employeesData);
      setShiftTypes(shiftTypesData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Create lookup maps
  const employeeMap = useMemo(() => {
    const map = new Map<string, Mitarbeiterverwaltung>();
    employees.forEach(emp => map.set(emp.record_id, emp));
    return map;
  }, [employees]);

  const shiftTypeMap = useMemo(() => {
    const map = new Map<string, Schichtartenverwaltung>();
    shiftTypes.forEach(st => map.set(st.record_id, st));
    return map;
  }, [shiftTypes]);

  const companyMap = useMemo(() => {
    const map = new Map<string, Unternehmensverwaltung>();
    companies.forEach(c => map.set(c.record_id, c));
    return map;
  }, [companies]);

  // Enrich shifts with related data
  const enrichedShifts = useMemo((): EnrichedShift[] => {
    return shifts.map(shift => {
      const employeeId = extractRecordId(shift.fields.zuweisung_mitarbeiter);
      const shiftTypeId = extractRecordId(shift.fields.zuweisung_schichtart);
      const companyId = extractRecordId(shift.fields.zuweisung_unternehmen);

      return {
        shift,
        employee: employeeId ? employeeMap.get(employeeId) || null : null,
        shiftType: shiftTypeId ? shiftTypeMap.get(shiftTypeId) || null : null,
        company: companyId ? companyMap.get(companyId) || null : null,
      };
    });
  }, [shifts, employeeMap, shiftTypeMap, companyMap]);

  // Today's shifts
  const todayShifts = useMemo(() => {
    const today = new Date();
    return enrichedShifts
      .filter(es => {
        if (!es.shift.fields.zuweisung_datum) return false;
        return isToday(parseISO(es.shift.fields.zuweisung_datum));
      })
      .sort((a, b) => {
        const timeA = a.shift.fields.zuweisung_beginn || '99:99';
        const timeB = b.shift.fields.zuweisung_beginn || '99:99';
        return timeA.localeCompare(timeB);
      });
  }, [enrichedShifts]);

  // This week's shifts count
  const thisWeekShiftsCount = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    return enrichedShifts.filter(es => {
      if (!es.shift.fields.zuweisung_datum) return false;
      const shiftDate = parseISO(es.shift.fields.zuweisung_datum);
      return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
    }).length;
  }, [enrichedShifts]);

  // Upcoming shifts (next 7 days, excluding today)
  const upcomingShifts = useMemo(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    return enrichedShifts
      .filter(es => {
        if (!es.shift.fields.zuweisung_datum) return false;
        const shiftDate = parseISO(es.shift.fields.zuweisung_datum);
        return !isBefore(shiftDate, tomorrow) && !isAfter(shiftDate, nextWeek);
      })
      .sort((a, b) => {
        const dateA = a.shift.fields.zuweisung_datum || '';
        const dateB = b.shift.fields.zuweisung_datum || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        const timeA = a.shift.fields.zuweisung_beginn || '99:99';
        const timeB = b.shift.fields.zuweisung_beginn || '99:99';
        return timeA.localeCompare(timeB);
      });
  }, [enrichedShifts]);

  // Chart data for desktop - shifts per day this week
  const weekChartData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return days.map((day, index) => {
      const date = addDays(weekStart, index);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = enrichedShifts.filter(es =>
        es.shift.fields.zuweisung_datum === dateStr
      ).length;
      return { name: day, schichten: count };
    });
  }, [enrichedShifts]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  // Determine how many shifts to show on mobile
  const mobileVisibleTodayShifts = showAllTodayShifts ? todayShifts : todayShifts.slice(0, 4);
  const hasMoreTodayShifts = todayShifts.length > 4;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold">Schichtplaner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </header>

        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-[65%_35%] lg:gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Hero: Today's Shifts */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Schichten heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-primary mb-4">
                  {todayShifts.length}
                </div>
                {todayShifts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine Schichten heute geplant.</p>
                ) : (
                  <div className="divide-y">
                    {todayShifts.map(es => (
                      <ShiftItem key={es.shift.record_id} enrichedShift={es} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart: Shifts this week */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Schichten diese Woche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekChartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        stroke="hsl(220 10% 45%)"
                        axisLine={{ stroke: 'hsl(40 15% 88%)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="hsl(220 10% 45%)"
                        axisLine={{ stroke: 'hsl(40 15% 88%)' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0 0% 100%)',
                          border: '1px solid hsl(40 15% 88%)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                        labelStyle={{ color: 'hsl(220 25% 18%)', fontWeight: 500 }}
                        cursor={{ fill: 'hsl(45 15% 93%)' }}
                      />
                      <Bar
                        dataKey="schichten"
                        fill="hsl(215 50% 35%)"
                        radius={[4, 4, 0, 0]}
                        name="Schichten"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Shifts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Kommende Schichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingShifts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine weiteren Schichten in den nächsten 7 Tagen.</p>
                ) : (
                  <div className="divide-y">
                    {upcomingShifts.slice(0, 10).map(es => (
                      <ShiftItem key={es.shift.record_id} enrichedShift={es} showDate />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card className="shadow-sm py-4">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{employees.length}</div>
                    <div className="text-xs text-muted-foreground">Mitarbeiter</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{shiftTypes.length}</div>
                    <div className="text-xs text-muted-foreground">Schichtarten</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{thisWeekShiftsCount}</div>
                    <div className="text-xs text-muted-foreground">Schichten diese Woche</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team List */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Team ({employees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine Mitarbeiter vorhanden.</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto divide-y">
                    {employees
                      .sort((a, b) => {
                        const nameA = a.fields.mitarbeiter_nachname || '';
                        const nameB = b.fields.mitarbeiter_nachname || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map(emp => (
                        <EmployeeAvatar key={emp.record_id} employee={emp} />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info (if exists) */}
            {companies.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Unternehmen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {companies.map(company => (
                    <div key={company.record_id} className="text-sm">
                      <div className="font-medium">{company.fields.unternehmen_name || 'Unbekannt'}</div>
                      {(company.fields.unternehmen_strasse || company.fields.unternehmen_ort) && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {company.fields.unternehmen_strasse} {company.fields.unternehmen_hausnummer}
                          {company.fields.unternehmen_strasse && company.fields.unternehmen_ort && ', '}
                          {company.fields.unternehmen_plz} {company.fields.unternehmen_ort}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* Hero: Today's Shifts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Schichten heute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary mb-4">
                {todayShifts.length}
              </div>
              {todayShifts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Schichten heute.</p>
              ) : (
                <>
                  <div className="divide-y">
                    {mobileVisibleTodayShifts.map(es => (
                      <ShiftItem key={es.shift.record_id} enrichedShift={es} />
                    ))}
                  </div>
                  {hasMoreTodayShifts && !showAllTodayShifts && (
                    <button
                      onClick={() => setShowAllTodayShifts(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Alle {todayShifts.length} Schichten anzeigen
                    </button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            <StatCard icon={Users} value={employees.length} label="Mitarbeiter" />
            <StatCard icon={Layers} value={shiftTypes.length} label="Schichtarten" />
            <StatCard icon={Calendar} value={thisWeekShiftsCount} label="Diese Woche" />
          </div>

          {/* Upcoming Shifts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kommende Schichten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingShifts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine weiteren Schichten geplant.</p>
              ) : (
                <div className="divide-y">
                  {upcomingShifts.slice(0, 5).map(es => (
                    <ShiftItem key={es.shift.record_id} enrichedShift={es} showDate />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="team" className="border rounded-xl bg-card px-4">
              <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline">
                Team ({employees.length})
              </AccordionTrigger>
              <AccordionContent>
                {employees.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keine Mitarbeiter.</p>
                ) : (
                  <div className="divide-y">
                    {employees
                      .sort((a, b) => {
                        const nameA = a.fields.mitarbeiter_nachname || '';
                        const nameB = b.fields.mitarbeiter_nachname || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map(emp => (
                        <EmployeeAvatar key={emp.record_id} employee={emp} />
                      ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
