import { useState, useEffect, useMemo } from 'react';
import type { Schichteinteilung, Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { format, parseISO, isToday, isBefore, addDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Calendar, Users, Clock, Building2, AlertCircle, RefreshCw } from 'lucide-react';

// Enriched shift type with resolved references
interface EnrichedShift extends Schichteinteilung {
  mitarbeiter?: Mitarbeiterverwaltung;
  schichtart?: Schichtartenverwaltung;
  unternehmen?: Unternehmensverwaltung;
}

// Check if shift is currently active
function isShiftActive(shift: EnrichedShift): boolean {
  if (!shift.fields.zuweisung_datum || !shift.fields.zuweisung_beginn || !shift.fields.zuweisung_ende) {
    return false;
  }

  const today = new Date();
  const shiftDate = shift.fields.zuweisung_datum;
  const todayStr = format(today, 'yyyy-MM-dd');

  if (shiftDate !== todayStr) return false;

  const now = format(today, 'HH:mm');
  const start = shift.fields.zuweisung_beginn;
  const end = shift.fields.zuweisung_ende;

  return now >= start && now <= end;
}

// Format employee name
function formatEmployeeName(employee?: Mitarbeiterverwaltung): string {
  if (!employee) return 'Unbekannt';
  const firstName = employee.fields.mitarbeiter_vorname || '';
  const lastName = employee.fields.mitarbeiter_nachname || '';
  return `${firstName} ${lastName}`.trim() || 'Unbekannt';
}

// Loading skeleton for shifts
function ShiftsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card">
          <Skeleton className="h-12 w-24" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-muted">
          <Skeleton className="h-8 w-12 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// Shift card component
function ShiftCard({
  shift,
  isActive,
  onClick
}: {
  shift: EnrichedShift;
  isActive: boolean;
  onClick: () => void;
}) {
  const timeRange = `${shift.fields.zuweisung_beginn || '00:00'} - ${shift.fields.zuweisung_ende || '00:00'}`;
  const employeeName = formatEmployeeName(shift.mitarbeiter);
  const shiftTypeName = shift.schichtart?.fields.schichtart_name || 'Schicht';

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-xl bg-card cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${isActive ? 'border-l-4 border-l-primary bg-accent/30' : 'border border-border'}
      `}
      onClick={onClick}
    >
      <div className={`
        font-mono text-base font-bold px-3 py-2 rounded-lg
        ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}
      `}>
        {timeRange}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-base truncate">{employeeName}</span>
          {isActive && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Aktiv</span>
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">{shiftTypeName}</div>
      </div>
    </div>
  );
}

// Compact shift row for upcoming section
function CompactShiftRow({ shift, onClick }: { shift: EnrichedShift; onClick: () => void }) {
  const date = shift.fields.zuweisung_datum
    ? format(parseISO(shift.fields.zuweisung_datum), 'EEE dd.MM', { locale: de })
    : '';
  const timeRange = `${shift.fields.zuweisung_beginn || '00:00'}-${shift.fields.zuweisung_ende || '00:00'}`;
  const employeeName = formatEmployeeName(shift.mitarbeiter);
  const shiftTypeName = shift.schichtart?.fields.schichtart_name || '';

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted cursor-pointer transition-colors text-sm"
      onClick={onClick}
    >
      <span className="text-muted-foreground w-16 shrink-0">{date}</span>
      <span className="font-mono font-medium w-24 shrink-0">{timeRange}</span>
      <span className="truncate flex-1">{employeeName}</span>
      <span className="text-muted-foreground truncate max-w-[100px]">{shiftTypeName}</span>
    </div>
  );
}

// Shift detail sheet
function ShiftDetailSheet({
  shift,
  open,
  onOpenChange
}: {
  shift: EnrichedShift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!shift) return null;

  const employeeName = formatEmployeeName(shift.mitarbeiter);
  const shiftTypeName = shift.schichtart?.fields.schichtart_name || 'Schicht';
  const companyName = shift.unternehmen?.fields.unternehmen_name || '-';
  const date = shift.fields.zuweisung_datum
    ? format(parseISO(shift.fields.zuweisung_datum), 'EEEE, dd. MMMM yyyy', { locale: de })
    : '-';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Schichtdetails</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Mitarbeiter</div>
            <div className="text-lg font-semibold">{employeeName}</div>
            {shift.mitarbeiter?.fields.mitarbeiter_email && (
              <div className="text-sm text-muted-foreground">{shift.mitarbeiter.fields.mitarbeiter_email}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Datum</div>
              <div className="font-medium">{date}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Uhrzeit</div>
              <div className="font-medium font-mono">
                {shift.fields.zuweisung_beginn || '00:00'} - {shift.fields.zuweisung_ende || '00:00'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Schichtart</div>
              <div className="font-medium">{shiftTypeName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Unternehmen</div>
              <div className="font-medium">{companyName}</div>
            </div>
          </div>

          {shift.fields.zuweisung_notiz && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Notiz</div>
              <div className="text-sm bg-muted p-3 rounded-lg">{shift.fields.zuweisung_notiz}</div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Add shift form
function AddShiftForm({
  employees,
  shiftTypes,
  companies,
  onSuccess,
  onCancel
}: {
  employees: Mitarbeiterverwaltung[];
  shiftTypes: Schichtartenverwaltung[];
  companies: Unternehmensverwaltung[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    datum: format(new Date(), 'yyyy-MM-dd'),
    beginn: '08:00',
    ende: '16:00',
    mitarbeiter: '',
    schichtart: '',
    unternehmen: '',
    notiz: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await LivingAppsService.createSchichteinteilungEntry({
        zuweisung_datum: formData.datum,
        zuweisung_beginn: formData.beginn,
        zuweisung_ende: formData.ende,
        zuweisung_mitarbeiter: formData.mitarbeiter
          ? createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, formData.mitarbeiter)
          : undefined,
        zuweisung_schichtart: formData.schichtart
          ? createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, formData.schichtart)
          : undefined,
        zuweisung_unternehmen: formData.unternehmen
          ? createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, formData.unternehmen)
          : undefined,
        zuweisung_notiz: formData.notiz || undefined
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2 col-span-2 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="beginn">Beginn</Label>
            <Input
              id="beginn"
              type="time"
              value={formData.beginn}
              onChange={(e) => setFormData(prev => ({ ...prev, beginn: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ende">Ende</Label>
            <Input
              id="ende"
              type="time"
              value={formData.ende}
              onChange={(e) => setFormData(prev => ({ ...prev, ende: e.target.value }))}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mitarbeiter">Mitarbeiter</Label>
        <Select
          value={formData.mitarbeiter}
          onValueChange={(v) => setFormData(prev => ({ ...prev, mitarbeiter: v }))}
        >
          <SelectTrigger id="mitarbeiter">
            <SelectValue placeholder="Mitarbeiter auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.record_id} value={emp.record_id}>
                {formatEmployeeName(emp)}
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
          <SelectTrigger id="schichtart">
            <SelectValue placeholder="Schichtart auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {shiftTypes.map((type) => (
              <SelectItem key={type.record_id} value={type.record_id}>
                {type.fields.schichtart_name || 'Unbenannt'}
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
          <SelectTrigger id="unternehmen">
            <SelectValue placeholder="Unternehmen auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.record_id} value={company.record_id}>
                {company.fields.unternehmen_name || 'Unbenannt'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notiz">Notiz (optional)</Label>
        <Textarea
          id="notiz"
          value={formData.notiz}
          onChange={(e) => setFormData(prev => ({ ...prev, notiz: e.target.value }))}
          placeholder="Zusätzliche Informationen..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? 'Speichern...' : 'Schicht eintragen'}
        </Button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const [shifts, setShifts] = useState<Schichteinteilung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EnrichedShift | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Fetch all data
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [shiftsData, employeesData, shiftTypesData, companiesData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getUnternehmensverwaltung()
      ]);
      setShifts(shiftsData);
      setEmployees(employeesData);
      setShiftTypes(shiftTypesData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Create lookup maps
  const employeeMap = useMemo(() => {
    const map = new Map<string, Mitarbeiterverwaltung>();
    employees.forEach(emp => map.set(emp.record_id, emp));
    return map;
  }, [employees]);

  const shiftTypeMap = useMemo(() => {
    const map = new Map<string, Schichtartenverwaltung>();
    shiftTypes.forEach(type => map.set(type.record_id, type));
    return map;
  }, [shiftTypes]);

  const companyMap = useMemo(() => {
    const map = new Map<string, Unternehmensverwaltung>();
    companies.forEach(company => map.set(company.record_id, company));
    return map;
  }, [companies]);

  // Enrich shifts with resolved references
  const enrichedShifts = useMemo<EnrichedShift[]>(() => {
    return shifts.map(shift => {
      const mitarbeiterId = extractRecordId(shift.fields.zuweisung_mitarbeiter);
      const schichtartId = extractRecordId(shift.fields.zuweisung_schichtart);
      const unternehmenId = extractRecordId(shift.fields.zuweisung_unternehmen);

      return {
        ...shift,
        mitarbeiter: mitarbeiterId ? employeeMap.get(mitarbeiterId) : undefined,
        schichtart: schichtartId ? shiftTypeMap.get(schichtartId) : undefined,
        unternehmen: unternehmenId ? companyMap.get(unternehmenId) : undefined
      };
    });
  }, [shifts, employeeMap, shiftTypeMap, companyMap]);

  // Filter today's shifts
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysShifts = useMemo(() => {
    return enrichedShifts
      .filter(s => s.fields.zuweisung_datum === todayStr)
      .sort((a, b) => {
        const aTime = a.fields.zuweisung_beginn || '00:00';
        const bTime = b.fields.zuweisung_beginn || '00:00';
        return aTime.localeCompare(bTime);
      });
  }, [enrichedShifts, todayStr]);

  // Filter upcoming shifts (next 7 days, excluding today)
  const upcomingShifts = useMemo(() => {
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const weekEnd = startOfDay(addDays(new Date(), 8));

    return enrichedShifts
      .filter(s => {
        if (!s.fields.zuweisung_datum) return false;
        const shiftDate = parseISO(s.fields.zuweisung_datum);
        return shiftDate >= tomorrow && shiftDate < weekEnd;
      })
      .sort((a, b) => {
        const aDate = a.fields.zuweisung_datum || '';
        const bDate = b.fields.zuweisung_datum || '';
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        const aTime = a.fields.zuweisung_beginn || '00:00';
        const bTime = b.fields.zuweisung_beginn || '00:00';
        return aTime.localeCompare(bTime);
      })
      .slice(0, 20);
  }, [enrichedShifts]);

  // Calculate week's shifts count
  const weekShiftsCount = useMemo(() => {
    const weekEnd = startOfDay(addDays(new Date(), 7));
    return enrichedShifts.filter(s => {
      if (!s.fields.zuweisung_datum) return false;
      const shiftDate = parseISO(s.fields.zuweisung_datum);
      return shiftDate >= startOfDay(new Date()) && shiftDate < weekEnd;
    }).length;
  }, [enrichedShifts]);

  // Handle add success
  function handleAddSuccess() {
    setAddDialogOpen(false);
    fetchData();
  }

  // Handle shift click
  function handleShiftClick(shift: EnrichedShift) {
    setSelectedShift(shift);
    setDetailSheetOpen(true);
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message}
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-3 w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Schichtplaner</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </span>
            {/* Desktop add button */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hidden md:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Schicht
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schicht eintragen</DialogTitle>
                </DialogHeader>
                <AddShiftForm
                  employees={employees}
                  shiftTypes={shiftTypes}
                  companies={companies}
                  onSuccess={handleAddSuccess}
                  onCancel={() => setAddDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left column - Main content */}
          <div className="space-y-6">
            {/* Today's shifts - Hero section */}
            <Card className="shadow-[0_4px_6px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.04)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Heute</span>
                    <Badge variant="secondary" className="font-normal">
                      {loading ? '...' : `${todaysShifts.length} Schichten`}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ShiftsSkeleton />
                ) : todaysShifts.length === 0 ? (
                  <EmptyState
                    title="Keine Schichten heute"
                    description="Für heute sind keine Schichten eingetragen."
                    action={
                      <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schicht eintragen
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {todaysShifts.map((shift) => (
                      <ShiftCard
                        key={shift.record_id}
                        shift={shift}
                        isActive={isShiftActive(shift)}
                        onClick={() => handleShiftClick(shift)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming shifts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nächste 7 Tage</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : upcomingShifts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Schichten in den nächsten 7 Tagen
                  </div>
                ) : (
                  <div className="space-y-1">
                    {upcomingShifts.map((shift) => (
                      <CompactShiftRow
                        key={shift.record_id}
                        shift={shift}
                        onClick={() => handleShiftClick(shift)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Stats */}
          <div className="space-y-6">
            {/* Stats grid */}
            {loading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{todaysShifts.length}</div>
                        <div className="text-xs text-muted-foreground">Schichten heute</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-2/10">
                        <Calendar className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{weekShiftsCount}</div>
                        <div className="text-xs text-muted-foreground">Diese Woche</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-3/10">
                        <Users className="h-5 w-5 text-chart-3" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{employees.length}</div>
                        <div className="text-xs text-muted-foreground">Mitarbeiter</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow lg:block hidden">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-chart-4/10">
                        <Building2 className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{companies.length}</div>
                        <div className="text-xs text-muted-foreground">Unternehmen</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Shift types overview - Desktop only */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schichtarten</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : shiftTypes.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Keine Schichtarten definiert
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shiftTypes.map((type) => (
                      <div
                        key={type.record_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium text-sm">{type.fields.schichtart_name || 'Unbenannt'}</span>
                        {type.fields.schichtart_beginn && type.fields.schichtart_ende && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {type.fields.schichtart_beginn} - {type.fields.schichtart_ende}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border md:hidden">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Schicht eintragen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schicht eintragen</DialogTitle>
            </DialogHeader>
            <AddShiftForm
              employees={employees}
              shiftTypes={shiftTypes}
              companies={companies}
              onSuccess={handleAddSuccess}
              onCancel={() => setAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Bottom padding for mobile to account for fixed button */}
      <div className="h-20 md:hidden" />

      {/* Shift detail sheet */}
      <ShiftDetailSheet
        shift={selectedShift}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}
